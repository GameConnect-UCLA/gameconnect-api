import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UnblockUserDto {
  @ApiProperty({
    description: 'User UUID to unblock',
  })
  @IsUUID()
  userId: string;
}
