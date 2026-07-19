import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ClearConversationDto {
  @ApiProperty({
    description: 'Conversation UUID to clear',
  })
  @IsUUID()
  conversationId: string;
}
