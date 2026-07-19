import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PostIDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}
