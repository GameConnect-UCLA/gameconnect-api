import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  IsUUID,
  Min,
  Max,
  IsObject,
  ValidateIf,
  IsDefined
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ required: false, example: 'Mi reseña de Hollow Knight' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false, example: 'Este juego me encantó por su arte y combate.' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    required: false,
    description: 'Media object returned by upload endpoint',
    example: {
      urls: ['https://zblamazxjzfgvnguugcb.supabase.co/storage/v1/object/public/gameconnect-storage/uploads/e4376d10-9b24-4a82-9eeb-feb2d91fd943-stocking.jpg']
    },
  })
  @IsObject()
  @IsOptional()
  media?: any;

  @ApiProperty({ required: false, example: ['hollowknight', 'metroidvania'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @ApiProperty({ required: false, example: true })
  @IsBoolean()
  @IsOptional()
  isReview?: boolean;

  @ApiProperty({
    required: false,
    example: '806eb301-e57b-4e19-9a6b-2d51120c4ac1',
    description: 'Required when isReview is true',
  })
  @ValidateIf((dto) => dto.isReview === true || dto.reviewedGame !== undefined)
  @IsDefined({ message: 'reviewedGame is required when isReview is true' })
  @IsUUID()
  @IsOptional()
  reviewedGame?: string;

  @ApiProperty({
    required: false,
    example: 8,
    description: 'Required when isReview is true',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  reviewScore?: number;

  @ApiProperty({ required: false, example: false })
  @IsBoolean()
  @IsOptional()
  isRepost?: boolean;

  @ApiProperty({ required: false, example: '2d7293dc-2bd0-4c3e-9220-79ee7e1d2e49' })
  @IsUUID()
  @IsOptional()
  originalPostId?: string;
}