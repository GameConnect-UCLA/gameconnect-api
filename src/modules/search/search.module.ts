import { Module } from '@nestjs/common';
import { MeiliModule } from '../meili/meili.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [MeiliModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

