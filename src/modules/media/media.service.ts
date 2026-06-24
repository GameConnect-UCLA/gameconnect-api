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

  async remove(supabaseFileId: string) {
    /** 
     * Checar: gameconnect-api/node_modules/.pnpm/@supabase+storage-js@2.108.1/node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts
     * 
     GET supabase storage file path filePath = 
     use supabase storage remove:
    @example Delete file
   * ```js
   * const { data, error } = await supabase
   *   .storage
   *   .from('avatars')
   *   .remove(['folder/avatar1.png'])
   * ```
   *
   * Response:
   * ```json
   * {
   *   "data": [],
   *   "error": null
   * }
     */

  }
}
