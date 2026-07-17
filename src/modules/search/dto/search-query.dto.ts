import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Term to search for' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type', enum: ['post', 'game', 'user'] })
  @IsOptional()
  @IsString()
  @IsIn(['post', 'game', 'user'])
  type?: string;

  @ApiPropertyOptional({ description: 'Filter posts by hashtag' })
  @IsOptional()
  @IsString()
  hashtag?: string;

  @ApiPropertyOptional({ description: 'Number of results to return', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
