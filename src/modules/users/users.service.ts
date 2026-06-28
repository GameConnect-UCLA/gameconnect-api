import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

  async getPublicProfile(id: string) {
    const [profile, followersCount, followingCount, gamesFollowingCount] =
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
          where: { followedId: id, followedType: 'USER' },
        }),
        // Siguiendo: usuarios a los que este usuario sigue
        this.prisma.follow.count({
          where: { followerId: id, followedType: 'USER' },
        }),
        // Juegos que este usuario sigue
        this.prisma.follow.count({
          where: { followerId: id, followedType: 'GAME' },
        }),
      ]);

    if (!profile) throw new NotFoundException('User not found');

    const { _count, ...rest } = profile;

    return {
      ...rest,
      postsCount: _count.posts,
      followersCount,
      followingCount,
      gamesFollowingCount,
    };
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.pronouns !== undefined && { pronouns: dto.pronouns }),
        ...(dto.profilePic !== undefined && { profilePic: dto.profilePic }),
        ...(dto.coverPic !== undefined && { coverPic: dto.coverPic }),
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
  }
}
