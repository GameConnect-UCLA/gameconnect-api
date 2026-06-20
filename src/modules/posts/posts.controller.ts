import { Body, Controller, UseGuards, Param, Get, Query, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import { PostIDto } from './dto/post.dto';
import { PostDetailResponseDto } from './dto/post-response.dto';
import { FeedPostResponseDto } from '../feed/dto/feed-response.dto';
import { PostsByUserParamsDto } from './dto/posts-by-user-params.dto';
import { LikePostDto } from './dto/like-post.dto';
import { LikeResponseDto } from './dto/like-response.dto';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
    constructor(private postsService: PostsService) {}

    @Post('like')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle like on a post' })
    @ApiOkResponse({ type: LikeResponseDto })
    @ApiResponse({ status: 404, description: 'User or post not found' })
    async toggleLike(@Req() req: any, @Body() dto: LikePostDto): Promise<LikeResponseDto> {
        return this.postsService.toggleLike(req.user.userId, dto);
    }

    @Get('user')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get posts by user' })
    @ApiResponse({ status: 200, type: [FeedPostResponseDto] })
    @ApiResponse({ status: 404, description: 'Post not found' })
    async getPostsByUser(@Query() dto: PostsByUserParamsDto): Promise<FeedPostResponseDto[]> {
        const userPosts = await this.postsService.getPostsByUser(dto);
        return userPosts;
    }

    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get post details' })
    @ApiResponse({ status: 200, description: 'Post details retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    async getPostDetails(@Param() dto: PostIDto): Promise<PostDetailResponseDto> {
        const postDetails = await this.postsService.postDetails(dto);
        return postDetails;
    }
}
