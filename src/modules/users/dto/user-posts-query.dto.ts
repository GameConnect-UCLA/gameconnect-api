import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UserPostsQueryDto {
  @ApiPropertyOptional({
    default: 10,
    minimum: 1,
    description: 'Number of posts to return',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({
    default: 0,
    minimum: 0,
    description: 'Offset for pagination',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset: number = 0;
}
