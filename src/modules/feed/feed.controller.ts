import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { FeedPostResponseDto } from './dto/feed-response.dto';

@ApiTags('Feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @ApiOperation({ summary: 'Get user feed' })
  @ApiResponse({ status: 200, type: [FeedPostResponseDto] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getFeed(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<FeedPostResponseDto[]> {
    const userId = req.user?.id || "8ac5edbe-c4dd-4a00-af73-528d8ebd3714";
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    const userPosts = await this.feedService.getHomeFeed(userId, parsedLimit, parsedOffset);

    return userPosts.map((post): FeedPostResponseDto => {
      return {
        id: post.id,
        author: post.author,
        originalPostId: post.originalPostId,
        title: post.title,
        content: post.content,
        media: post.media,
        hashtags: post.hashtags,
        isReview: post.isReview,
        isRepost: post.isRepost,
        reviewedGame: post.reviewedGame,
        reviewScore: post.reviewScore,
        likesCounter: post.likesCounter,
        commentsCounter: post.commentsCounter,
        createdAt: post.createdAt,
        lastModifiedAt: post.lastModifiedAt,
        deletedAt: post.deletedAt,
        
        authorUsername: post.authorUser?.username || null,
        authorDisplayName: post.authorUser?.displayName || null,
        authorProfilePic: post.authorUser?.profilePic || null,
      };
    });
  }
}