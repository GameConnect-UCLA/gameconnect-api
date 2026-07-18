import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DeleteMessageDto {
  @ApiProperty({ description: 'Conversation UUID' })
  @IsUUID()
  conversationId: string;

  @ApiProperty({ description: 'Message UUID to delete' })
  @IsUUID()
  messageId: string;
}
