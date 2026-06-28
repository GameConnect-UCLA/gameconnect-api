import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { SupabaseProvider } from './supabase.provider';

@Module({
  providers: [SupabaseProvider, MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
