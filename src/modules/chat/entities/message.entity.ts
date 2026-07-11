import { ApiProperty } from '@nestjs/swagger';

export class MessageEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sentBy: string;

  @ApiProperty({ required: false })
  conversation: string | null;

  @ApiProperty({ required: false })
  replyTo: string | null;

  @ApiProperty()
  type: 'GROUP_MESSAGE' | 'DIRECT_MESSAGE';

  @ApiProperty({ required: false })
  messageText: string | null;

  @ApiProperty({ required: false })
  attachedMedia: unknown;

  @ApiProperty()
  sentAt: string;

  @ApiProperty({ required: false })
  senderUsername: string | null;

  @ApiProperty({ required: false })
  senderProfilePic: string | null;

  @ApiProperty({ required: false })
  replyToMessage: unknown;

  @ApiProperty({ required: false })
  gameCard: unknown;
}
