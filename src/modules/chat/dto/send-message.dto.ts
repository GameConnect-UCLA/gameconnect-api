import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  IsArray,
} from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Conversation UUID' })
  @IsUUID()
  conversationId: string;

  @ApiProperty({ required: false, description: 'Text content of the message' })
  @IsString()
  @IsOptional()
  messageText?: string;

  @ApiProperty({ required: false, description: 'Media attachments' })
  @IsArray()
  @IsOptional()
  attachments?: any[];

  @ApiProperty({
    required: false,
    description: 'ID of the message being replied to',
  })
  @IsUUID()
  @IsOptional()
  replyToId?: string;

  @ApiProperty({ required: false, description: 'Game card embed data' })
  @IsObject()
  @IsOptional()
  gameCard?: any;
}
