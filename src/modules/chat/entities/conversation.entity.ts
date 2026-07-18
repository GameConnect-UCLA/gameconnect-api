import { ApiProperty } from '@nestjs/swagger';

export class ConversationEntity {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  name: string | null;

  @ApiProperty({ required: false })
  groupPicture: string | null;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  type: 'DIRECT' | 'GROUP';

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  isGroup: boolean;

  @ApiProperty()
  memberCount: number;

  @ApiProperty({ required: false })
  lastMessage: string | null;

  @ApiProperty({ required: false })
  lastMessageTime: string | null;

  @ApiProperty({ required: false })
  lastMessageSender: string | null;

  @ApiProperty()
  members: Record<string, unknown>[];

  @ApiProperty()
  messages: Record<string, unknown>[];
}
