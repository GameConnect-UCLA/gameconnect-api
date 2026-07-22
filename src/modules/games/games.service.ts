import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FolloweeType } from '../../generated/prisma/enums';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  private mapGame(game: any, isFollowing = false) {
    const metadata = game.metadata || {};
    return {
      id: game.id,
      title: metadata.name || 'Juego Desconocido',
      developer: metadata.genre || 'Desconocido',
      coverUrl: metadata.cover_url || '',
      background_url: metadata.cover_url || '',
      score: game.score != null ? Math.round(game.score / 2) : 50,
      rating_count: game.reviewRatingCount || 0,
      tags: metadata.platforms || [],
      description: metadata.summary || metadata.genre || '',
      reviews: [],
      isFollowing,
    };
  }

  async findAll() {
    const games = await this.prisma.game.findMany();
    return games.map((game) => this.mapGame(game));
  }

  async findById(id: string, userId?: string) {
    const game = await this.prisma.game.findUnique({
      where: { id },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    let isFollowing = false;
    if (userId) {
      const follow = await this.prisma.follow.findFirst({
        where: {
          followerId: userId,
          followedId: id,
          followedType: FolloweeType.GAME,
        },
      });
      isFollowing = !!follow;
    }

    return this.mapGame(game, isFollowing);
  }

  async search(query: string) {
    const games = await this.prisma.game.findMany();
    if (!query || !query.trim()) {
      return games.map((g) => this.mapGame(g));
    }
    const lower = query.toLowerCase();
    return games
      .filter((game) => {
        const metadata = game.metadata as any || {};
        const name = (metadata.name || '').toLowerCase();
        const genre = (metadata.genre || '').toLowerCase();
        return name.includes(lower) || genre.includes(lower);
      })
      .map((game) => this.mapGame(game));
  }

  async toggleFollowGame(userId: string, gameId: string) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');

    const existingFollow = await this.prisma.follow.findFirst({
      where: {
        followerId: userId,
        followedId: gameId,
        followedType: FolloweeType.GAME,
      },
    });

    if (existingFollow) {
      await this.prisma.follow.delete({ where: { id: existingFollow.id } });
    } else {
      await this.prisma.follow.create({
        data: {
          followerId: userId,
          followedId: gameId,
          followedType: FolloweeType.GAME,
        },
      });
    }

    const followersCount = await this.prisma.follow.count({
      where: { followedId: gameId, followedType: FolloweeType.GAME },
    });

    return {
      following: !existingFollow,
      followersCount,
    };
  }
}

