import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global and filtered search' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.search({
      q: query.q,
      type: query.type,
      hashtag: query.hashtag,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Bulk synchronization from local database to Meilisearch',
  })
  @ApiResponse({
    status: 200,
    description: 'Synchronization task started successfully',
  })
  async syncDatabase() {
    return this.searchService.syncLocalDatabase();
  }
}
