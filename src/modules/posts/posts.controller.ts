import { Controller, UseGuards, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import { PostIDto } from './dto/post.dto';
import { PostDetailResponseDto } from './dto/post-response.dto';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
    constructor(private postsService: PostsService) {}

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
