import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({ description: 'Target user UUID to block or unblock' })
  @IsUUID()
  userId: string;
}
