import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdatePostContentDto {
  @ApiProperty({ description: 'Updated content for the post' })
  @IsString()
  content: string;
}
