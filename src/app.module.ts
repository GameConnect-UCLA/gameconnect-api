import { Controller, Get, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { FeedModule } from './modules/feed/feed.module';
import { GamesModule } from './modules/games/games.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { MediaModule } from './modules/media/media.module';
import { EmailModule } from './modules/email/email.module';
import { ValkeyModule } from './modules/valkey/valkey.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';


@Controller()
class AppController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    FeedModule,
    GamesModule,
    ChatModule,
    NotificationsModule,
    SearchModule,
    ModerationModule,
    MediaModule,
    EmailModule,
    ValkeyModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
