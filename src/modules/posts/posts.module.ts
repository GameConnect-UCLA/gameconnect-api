import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [AuthModule, MediaModule, SearchModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}

