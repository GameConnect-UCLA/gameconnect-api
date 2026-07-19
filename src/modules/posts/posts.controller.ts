import {
  Body,
  Controller,
  UseGuards,
  Param,
  Get,
  Query,
  Post,
  Req,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import { PostIDto } from './dto/post.dto';
import { PostsByUserParamsDto } from './dto/posts-by-user-params.dto';
import { LikePostDto } from './dto/like-post.dto';
import {
  CreateCommentDto,
  PostCommentsQueryDto,
} from './dto/post-comments-query.dto';
import { UpdatePostContentDto } from './dto/update-post-content.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { BookmarksQueryDto } from './dto/bookmarks-query.dto';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createPost(@Req() req: any, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(req.user.userId, dto);
  }

  @Post('like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on a post' })
  @ApiResponse({ status: 404, description: 'User or post not found' })
  async toggleLike(@Req() req: any, @Body() dto: LikePostDto) {
    return this.postsService.toggleLike(req.user.userId, dto);
  }

  @Post(':id/comment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create comment on a post' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 404, description: 'User or post not found' })
  async createComment(
    @Req() req: any,
    @Param() dto: PostIDto,
    @Body() body: CreateCommentDto,
  ) {
    return this.postsService.createComment(req.user.userId, dto, body);
  }

  @Post(':id/bookmark')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle bookmark on a post' })
  @ApiResponse({
    status: 200,
    description: 'Post bookmarked/unbookmarked successfully',
  })
  @ApiResponse({ status: 404, description: 'User or post not found' })
  async toggleBookmark(@Req() req: any, @Param() dto: PostIDto) {
    return this.postsService.toggleBookmark(req.user.userId, dto.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update post content (within 24h by author only)' })
  @ApiResponse({
    status: 200,
    description: 'Post content updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only the author can edit this post or 24h window expired',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async updatePostContent(
    @Req() req: any,
    @Param() dto: PostIDto,
    @Body() body: UpdatePostContentDto,
  ) {
    return this.postsService.updatePostContent(req.user.userId, dto, body);
  }

  @Get(':id/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comments from a post' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post or comments not found' })
  async getPostComments(
    @Param() dto: PostIDto,
    @Query() query: PostCommentsQueryDto,
  ) {
    return this.postsService.getPostComments(dto, query);
  }

  @Get('bookmarks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user bookmarked posts' })
  @ApiResponse({
    status: 200,
    description: 'Bookmarked posts retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'No bookmarked posts found' })
  async getBookmarkedPosts(@Req() req: any, @Query() dto: BookmarksQueryDto) {
    return this.postsService.getBookmarkedPosts(req.user.userId, dto);
  }

  @Get('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts by user' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostsByUser(@Query() dto: PostsByUserParamsDto) {
    const userPosts = await this.postsService.getPostsByUser(dto);
    return userPosts;
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get post details' })
  @ApiResponse({
    status: 200,
    description: 'Post details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostDetails(@Param() dto: PostIDto) {
    const postDetails = await this.postsService.postDetails(dto);
    return postDetails;
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete post and its associated assets' })
  @ApiResponse({
    status: 200,
    description: 'Post and associated assets deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only the author can delete this post or 24h window expired',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(@Req() req: any, @Param() dto: PostIDto) {
    return this.postsService.deletePost(req.user.userId, dto.id);
  }
}
