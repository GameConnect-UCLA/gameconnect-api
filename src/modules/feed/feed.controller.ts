import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { FeedPostResponseDto } from './dto/feed-response.dto';
import { FeedParamsDto } from './dto/feed-params.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Feed')
@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user feed' })
  @ApiResponse({ status: 200, description: 'Feed retrieved successfully'})
  async getFeed(
    @Query() dto: FeedParamsDto){
    const userPosts = await this.feedService.getHomeFeed(dto);
    return userPosts
  }
}