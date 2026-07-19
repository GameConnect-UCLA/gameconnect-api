import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
export class SearchPostDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}
