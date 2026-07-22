import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  AccountSettingsDto,
  DEFAULT_ACCOUNT_SETTINGS,
} from './dto/account-settings.dto';
import { SearchService } from '../search/search.service';
import { FavoriteType, FolloweeType } from '../../generated/prisma/enums';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) { }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        bio: true,
        pronouns: true,
        birthDate: true,
        role: true,
        state: true,
        profilePic: true,
        coverPic: true,
        verified: true,
        createdAt: true,
        accountSettings: true,
        favoriteGames: {
          select: {
            id: true,
            game: {
              select: {
                id: true,
                metadata: true,
              },
            },
          },
        },
      },
    });
  }

  async getPublicProfile(id: string, viewerId?: string) {
    const [profile, followersCount, followingCount, gamesFollowingCount, isFollowingResult] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            pronouns: true,
            role: true,
            state: true,
            profilePic: true,
            coverPic: true,
            verified: true,
            createdAt: true,
            favoriteGames: {
              select: {
                id: true,
                game: {
                  select: {
                    id: true,
                    metadata: true,
                  },
                },
              },
            },
            _count: {
              select: {
                posts: true,
              },
            },
          },
        }),
        // Seguidores: usuarios que siguen a este usuario
        this.prisma.follow.count({
          where: { followedId: id, followedType: FolloweeType.USER },
        }),
        // Siguiendo: usuarios a los que este usuario sigue
        this.prisma.follow.count({
          where: { followerId: id, followedType: FolloweeType.USER },
        }),
        // Juegos que este usuario sigue
        this.prisma.follow.count({
          where: { followerId: id, followedType: 'GAME' },
        }),
        // ¿El viewer ya sigue a este usuario?
        viewerId && viewerId !== id
          ? this.prisma.follow.findFirst({
              where: {
                followerId: viewerId,
                followedId: id,
                followedType: FolloweeType.USER,
              },
              select: { id: true },
            })
          : Promise.resolve(null),
      ]);

    if (!profile) throw new NotFoundException('User not found');

    const { _count, ...rest } = profile;

    return {
      ...rest,
      postsCount: _count.posts,
      followersCount,
      followingCount,
      gamesFollowingCount,
      isFollowing: !!isFollowingResult,
    };
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.pronouns !== undefined && { pronouns: dto.pronouns }),
        ...(dto.profilePic !== undefined && { profilePic: dto.profilePic }),
        ...(dto.coverPic !== undefined && { coverPic: dto.coverPic }),
        ...(dto.birthDate !== undefined && { birthDate: new Date(dto.birthDate) }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        bio: true,
        pronouns: true,
        birthDate: true,
        role: true,
        state: true,
        profilePic: true,
        coverPic: true,
        verified: true,
        createdAt: true,
      },
    });

    await this.searchService.indexUser(updatedUser);
    return updatedUser;
  }

  /**
   * Devuelve los ajustes de la cuenta, rellenando con los valores por defecto
   * las claves que el usuario nunca haya tocado.
   */
  async getSettings(id: string): Promise<Required<AccountSettingsDto>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { accountSettings: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const stored = (user.accountSettings ?? {}) as Partial<AccountSettingsDto>;
    return { ...DEFAULT_ACCOUNT_SETTINGS, ...stored };
  }

  /**
   * Actualización parcial: solo pisa las claves que vengan en el body,
   * el resto de los ajustes se conservan.
   */
  async updateSettings(
    id: string,
    dto: AccountSettingsDto,
  ): Promise<Required<AccountSettingsDto>> {
    const current = await this.getSettings(id);

    // Sin este filtro, una clave ausente en el body llegaría como undefined
    // y borraría el valor que el usuario ya tenía guardado.
    const patch = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    const merged = { ...current, ...patch } as Required<AccountSettingsDto>;

    await this.prisma.user.update({
      where: { id },
      data: { accountSettings: merged },
    });

    return merged;
  }

  /**
   * Borrado lógico: el usuario deja de tener acceso pero sus posts,
   * comentarios y demás relaciones siguen apuntando a una fila existente.
   */
  async softDeleteAccount(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.deletedAt) return { success: true };

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), state: 'TO_DELETE' },
      }),
      // Cierra la sesión en todos los dispositivos
      this.prisma.userAuth.updateMany({
        where: { userId: id },
        data: { refreshToken: null },
      }),
    ]);

    await this.searchService.deleteUser(id);
    return { success: true };
  }

  async toggleFollowUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Un usuario no puede seguirse a sí mismo');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User not found');

    const existingFollow = await this.prisma.follow.findFirst({
      where: {
        followerId: currentUserId,
        followedId: targetUserId,
        followedType: FolloweeType.USER,
      },
    });

    if (existingFollow) {
      await this.prisma.follow.delete({ where: { id: existingFollow.id } });
    } else {
      await this.prisma.follow.create({
        data: {
          followerId: currentUserId,
          followedId: targetUserId,
          followedType: FolloweeType.USER,
        },
      });
    }

    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({
        where: { followedId: targetUserId, followedType: FolloweeType.USER },
      }),
      this.prisma.follow.count({
        where: { followerId: targetUserId, followedType: FolloweeType.USER },
      }),
    ]);

    return {
      following: !existingFollow,
      followersCount,
      followingCount,
    };
  }

  async getUserFavorites(userId: string, limit = 10, offset = 0) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const favorites = await this.prisma.favorite.findMany({
      where: { userId, itemType: FavoriteType.POST },
      take: limit,
      skip: offset,
      include: {
        post: {
          include: {
            authorUser: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePic: true,
              },
            },
            game: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return favorites.map((f) => f.post).filter(Boolean);
  }

  async getUserFollowers(userId: string, limit = 10, offset = 0) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const follows = await this.prisma.follow.findMany({
      where: { followedId: userId, followedType: FolloweeType.USER },
      take: limit,
      skip: offset,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePic: true,
            bio: true,
            verified: true,
          },
        },
      },
    });

    return follows.map((f) => f.follower);
  }

  async getUserFollowing(userId: string, limit = 10, offset = 0) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId, followedType: FolloweeType.USER },
      take: limit,
      skip: offset,
    });

    const followedUserIds = follows.map((f) => f.followedId);
    if (followedUserIds.length === 0) return [];

    return this.prisma.user.findMany({
      where: { id: { in: followedUserIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        profilePic: true,
        bio: true,
        verified: true,
      },
    });
  }
}
