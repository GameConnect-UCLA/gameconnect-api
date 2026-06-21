import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedParamsDto } from './dto/feed-params.dto';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeFeed(dto: FeedParamsDto){
    try {
        await this.prisma.user.findUnique({
        where: { id: dto.userId },
        select: { id: true },
      });
    } catch (error) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // id de los usuarios  que se siguen
    const following = await this.prisma.follow.findMany({
      where: { followerId: dto.userId },
      select: { followedId: true },
    });
    const followedIds = following.map((f) => f.followedId);

    let feedPosts: any[] = [];

    // Busqueda por posts de usuarios que se siguen
    const followedPosts = await this.prisma.post.findMany({
      where: { 
        author: { in: followedIds }, 
        deletedAt: null 
      },
      orderBy: { createdAt: 'desc' },
      skip: dto.offset,
      take: dto.limit,
      include: {
        authorUser: {
          select: {
            username: true,
            displayName: true,
            profilePic: true,
          },
        },
      },
    });

    feedPosts = [...followedPosts];

    // Busqueda por likes si ya se acabon los posts de los seguidos

    if (feedPosts.length < dto.limit) {
      const remainingLimit = dto.limit - feedPosts.length;
      const likesOffset = Math.max(0, dto.offset - followedPosts.length);

      const popularByLikes = await this.prisma.post.findMany({
        where: {
          id: { notIn: feedPosts.map((p) => p.id) }, // Evitamos duplicar
          deletedAt: null,
        },
        orderBy: { likesCounter: 'desc' },
        skip: likesOffset,
        take: remainingLimit,
        include: {
          authorUser: {
            select: {
              username: true,
              displayName: true,
              profilePic: true,
            },
          },
        },
      });

      feedPosts = [...feedPosts, ...popularByLikes];
    }

    // Busqueda por comentarios si ya se acabon los posts de los seguidos y los populares por likes
    if (feedPosts.length < dto.limit) {
      const remainingLimit = dto.limit - feedPosts.length;
      const commentsOffset = Math.max(0, dto.offset - feedPosts.length);

      const popularByComments = await this.prisma.post.findMany({
        where: {
          id: { notIn: feedPosts.map((p) => p.id) },
          deletedAt: null,
        },
        orderBy: { commentsCounter: 'desc' },
        skip: commentsOffset,
        take: remainingLimit,
        include: {
          authorUser: {
            select: {
              username: true,
              displayName: true,
              profilePic: true,
            },
          },
        },
      });

      feedPosts = [...feedPosts, ...popularByComments];
    }

    if (feedPosts.length === 0) {
      throw new NotFoundException('No se han encontrado resultados');
    }

    return feedPosts;
  }
}