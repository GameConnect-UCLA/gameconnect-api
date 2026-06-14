import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { SUPABASE_CLIENT } from './supabase.provider';

@Injectable()
export class MediaService {
  private readonly bucket: string;

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow('SUPABASE_STORAGE_BUCKET');
  }

  async upload(file: Express.Multer.File) {
    const path = `uploads/${randomUUID()}-${file.originalname}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return { url: urlData.publicUrl };
  }
}
