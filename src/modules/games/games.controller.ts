import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Games')
@Controller('games')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all games' })
  async findAll() {
    return this.gamesService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search games' })
  async search(@Query('q') query: string) {
    return this.gamesService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get game by ID' })
  async findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.gamesService.findById(id, req.user?.userId);
  }

  @Post(':id/follow')
  @ApiOperation({ summary: 'Toggle follow/unfollow a game' })
  @ApiParam({ name: 'id', description: 'Game UUID' })
  @ApiResponse({ status: 200, description: 'Follow status updated' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async toggleFollow(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.gamesService.toggleFollowGame(req.user.userId, id);
  }
}

