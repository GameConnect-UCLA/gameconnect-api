import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedParamsDto } from './dto/feed-params.dto';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeFeed(userId: string, dto: FeedParamsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followedId: true },
    });
    const followedIds = following.map((f) => f.followedId);

    const max = dto.offset + dto.limit;

    const postsInclude = {
      authorUser: {
        select: { username: true, displayName: true, profilePic: true },
      },
    };

    const followedPosts = await this.prisma.post.findMany({
      where: { author: { in: followedIds }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: max,
      include: postsInclude,
    });

    const excludedIds = followedPosts.map((p) => p.id);

    const popularByLikes = await this.prisma.post.findMany({
      where: { id: { notIn: excludedIds }, deletedAt: null },
      orderBy: { likesCounter: 'desc' },
      take: max,
      include: postsInclude,
    });

    excludedIds.push(...popularByLikes.map((p) => p.id));

    const popularByComments = await this.prisma.post.findMany({
      where: { id: { notIn: excludedIds }, deletedAt: null },
      orderBy: { commentsCounter: 'desc' },
      take: max,
      include: postsInclude,
    });

    const merged = [...followedPosts, ...popularByLikes, ...popularByComments];
    return merged.slice(dto.offset, dto.offset + dto.limit);
  }

  async getTrendingFeed(dto: FeedParamsDto) {
    const trendingPosts = await this.prisma.post.findMany({
      where: { deletedAt: null },
      orderBy: [{ likesCounter: 'desc' }, { commentsCounter: 'desc' }],
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

    return trendingPosts;
  }
}
