import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PostsModule } from '../posts/posts.module';
import { SearchModule } from '../search/search.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule, PostsModule, SearchModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
