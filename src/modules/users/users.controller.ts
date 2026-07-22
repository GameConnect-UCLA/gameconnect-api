import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from '../posts/posts.service';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AccountSettingsDto } from './dto/account-settings.dto';
import { UserPostsQueryDto } from './dto/user-posts-query.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private users: UsersService,
    private posts: PostsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  @ApiResponse({ status: 401, description: 'No active session' })
  async getMe(@Req() req: any) {
    return this.users.findById(req.user.userId);
  }

  @Get('me/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user account settings' })
  @ApiResponse({ status: 200, description: 'Account settings (with defaults applied)' })
  @ApiResponse({ status: 401, description: 'No active session' })
  async getMySettings(@Req() req: any) {
    return this.users.getSettings(req.user.userId);
  }

  @Patch('me/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Partially update account settings' })
  @ApiResponse({ status: 200, description: 'Updated account settings' })
  @ApiResponse({ status: 401, description: 'No active session' })
  async updateMySettings(@Req() req: any, @Body() dto: AccountSettingsDto) {
    return this.users.updateSettings(req.user.userId, dto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own account (soft delete)' })
  @ApiResponse({ status: 200, description: 'Account marked as deleted' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteMyAccount(@Req() req: any) {
    return this.users.softDeleteAccount(req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user account by id (only your own account)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Account marked as deleted' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Cannot delete a profile that is not yours' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteAccountById(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (req.user.userId !== id) {
      throw new ForbiddenException('You can only delete your own account');
    }
    return this.users.softDeleteAccount(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile (only your own account)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Updated profile' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Cannot edit a profile that is not yours' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    if (req.user.userId !== id) {
      throw new ForbiddenException('You can only edit your own profile');
    }
    return this.users.updateProfile(id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get any user public profile by id' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Public profile with counters and isFollowing' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.users.getPublicProfile(id, req.user.userId);
  }

  @Get(':id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts published by a user (paginated)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'List of posts published by the user' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPosts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: UserPostsQueryDto,
  ) {
    return this.posts.getPostsByUser({
      userId: id,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle follow/unfollow a user' })
  @ApiParam({ name: 'id', description: 'User UUID to follow/unfollow' })
  @ApiResponse({ status: 200, description: 'Toggled follow status and updated counts' })
  @ApiResponse({ status: 400, description: 'Cannot follow self' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async toggleFollow(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.users.toggleFollowUser(req.user.userId, id);
  }

  @Get('me/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user bookmarked/favorited posts (paginated)' })
  @ApiResponse({ status: 200, description: 'List of favorited posts' })
  @ApiResponse({ status: 401, description: 'No active session' })
  async getMyFavorites(
    @Req() req: any,
    @Query() query: UserPostsQueryDto,
  ) {
    return this.users.getUserFavorites(req.user.userId, query.limit, query.offset);
  }

  @Get(':id/favorites')
  @ApiOperation({ summary: 'Get user bookmarked/favorited posts (paginated)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'List of favorited posts' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserFavorites(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: UserPostsQueryDto,
  ) {
    return this.users.getUserFavorites(id, query.limit, query.offset);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers list (paginated)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'List of followers' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserFollowers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: UserPostsQueryDto,
  ) {
    return this.users.getUserFollowers(id, query.limit, query.offset);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get user following list (paginated)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'List of followed users' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserFollowing(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: UserPostsQueryDto,
  ) {
    return this.users.getUserFollowing(id, query.limit, query.offset);
  }
}

