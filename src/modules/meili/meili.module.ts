import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MeiliService } from './meili.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MeiliService],
  exports: [MeiliService],
})
export class MeiliModule {}
