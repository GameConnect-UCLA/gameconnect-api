import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
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
  async getProfile(@Req() req: any) {
    const res = await this.users.findById(req.user.userId);
    console.log(res)
    return res
  }

  @Patch('me')
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
  @ApiResponse({ status: 200, description: 'Public profile with counters' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.getPublicProfile(id);
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

}
