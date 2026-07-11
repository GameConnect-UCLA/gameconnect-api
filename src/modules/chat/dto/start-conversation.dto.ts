import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class StartConversationDto {
  @ApiProperty({
    description: 'Target user ID to start a direct conversation with',
  })
  @IsUUID()
  userId: string;
}
