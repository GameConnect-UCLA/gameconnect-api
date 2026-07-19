import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

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
  async findOne(@Param('id') id: string) {
    return this.gamesService.findById(id);
  }
}
