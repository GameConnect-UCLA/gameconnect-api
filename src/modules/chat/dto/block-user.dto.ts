import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({
    description: 'User UUID to block',
  })
  @IsUUID()
  userId: string;
}
