import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Ajusta la ruta si es necesario

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeFeed(userID: string, limit: number = 10, offset: number = 0): Promise<any[]> {
    // id de los usuarios  que se siguen
    const following = await this.prisma.follow.findMany({
      where: { followerId: userID },
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
      skip: offset,
      take: limit,
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
    /*
    if (feedPosts.length < limit) {
      const remainingLimit = limit - feedPosts.length;
      const likesOffset = Math.max(0, offset - followedPosts.length);

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
    if (feedPosts.length < limit) {
      const remainingLimit = limit - feedPosts.length;
      const commentsOffset = Math.max(0, offset - feedPosts.length);

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
    }*/

    return feedPosts;
  }
}