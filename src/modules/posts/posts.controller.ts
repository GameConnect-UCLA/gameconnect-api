import { Body, Controller, UseGuards, Param, Get, Query, Post, Req, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import { PostIDto } from './dto/post.dto';
import { PostDetailResponseDto } from './dto/post-response.dto';
import { FeedPostResponseDto } from '../feed/dto/feed-response.dto';
import { PostsByUserParamsDto } from './dto/posts-by-user-params.dto';
import { LikePostDto } from './dto/like-post.dto';
import { LikeResponseDto } from './dto/like-response.dto';
import { PostCommentsQueryDto } from './dto/post-comments-query.dto';
import { UpdatePostContentDto } from './dto/update-post-content.dto';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
    constructor(private postsService: PostsService) {}

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update post content (within 24h by author only)' })
    @ApiResponse({ status: 200, description: 'Post content updated successfully' })
    @ApiResponse({ status: 403, description: 'Only the author can edit this post or 24h window expired' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    async updatePostContent(@Req() req: any, @Param() dto: PostIDto, @Body() body: UpdatePostContentDto) {
        return this.postsService.updatePostContent(req.user.userId, dto, body);
    }

    @Post('like')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle like on a post' })
    @ApiOkResponse({ type: LikeResponseDto })
    @ApiResponse({ status: 404, description: 'User or post not found' })
    async toggleLike(@Req() req: any, @Body() dto: LikePostDto){
        return this.postsService.toggleLike(req.user.userId, dto);
    }

    @Get(':id/comments')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get comments from a post' })
    @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Post or comments not found' })
    async getPostComments(
        @Param() dto: PostIDto,
        @Query() query: PostCommentsQueryDto,
    ){
        return this.postsService.getPostComments(dto, query);
    }

    @Get('user')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get posts by user' })
    @ApiResponse({ status: 200, type: [FeedPostResponseDto] })
    @ApiResponse({ status: 404, description: 'Post not found' })
    async getPostsByUser(@Query() dto: PostsByUserParamsDto){
        const userPosts = await this.postsService.getPostsByUser(dto);
        return userPosts;
    }

    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get post details' })
    @ApiResponse({ status: 200, description: 'Post details retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    async getPostDetails(@Param() dto: PostIDto){
        const postDetails = await this.postsService.postDetails(dto);
        return postDetails;
    }
}
