import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class BookmarksQueryDto {
  @ApiProperty({
    required: true,
    default: 10,
    minimum: 1,
    description: 'Number of bookmarks to return',
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
