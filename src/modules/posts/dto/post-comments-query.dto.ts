import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsObject } from 'class-validator';

export class PostCommentsQueryDto {
  @ApiProperty({
    required: true,
    default: 10,
    minimum: 1,
    description: 'Number of comments to return',
  })
  @IsInt()
  limit: number = 10;

  @ApiProperty({
    required: true,
    default: 0,
    minimum: 0,
    description: 'Offset for pagination',
  })
  @IsInt()
  offset: number = 0;
}

export class CreateCommentDto {
  @ApiProperty({ required: true, description: 'Content of the comment' })
  @IsString()
  content: string;

  @ApiProperty({
    required: false,
    description: 'Optional media object returned by upload endpoint',
  })
  @IsOptional()
  @IsObject()
  media?: any;
}
