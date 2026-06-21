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
  IsObject 
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  media?: any;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isReview?: boolean;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  reviewedGame?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(10) // Ajusta el máximo según la escala de GameConnect
  @IsOptional()
  reviewScore?: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isRepost?: boolean;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  originalPostId?: string;
}