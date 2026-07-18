import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

export interface MemberInfo {
  id: string;
  userId: string;
  conversation: string;
  role: string;
  joinedAt: string | null;
  leftAt: string | null;
  username: string | null;
  profilePic: string | null;
}

export interface MessageInfo {
  id: string;
  sentBy: string;
  conversation: string | null;
  replyTo: string | null;
  type: string;
  messageText: string | null;
  attachedMedia: unknown;
  sentAt: string | null;
  senderUsername: string | null;
  senderProfilePic: string | null;
  replyToMessage: unknown;
  gameCard: unknown;
}

export interface ConversationInfo {
  id: string;
  name: string | null;
  groupPicture: string | null;
  createdBy: string;
  createdAt: string | null;
  isGroup: boolean;
  memberCount: number;
  lastMessage: string | null;
  lastMessageTime: string | null;
  lastMessageSender: string | null;
  members: MemberInfo[];
  messages: MessageInfo[];
}

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async ensureMember(conversationId: string, userId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { conversationId, userId, leftAt: null },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this conversation');
    }
    return member;
  }

  async createDirectConversation(
    currentUserId: string,
    targetUserId: string,
  ): Promise<ConversationInfo> {
    if (currentUserId === targetUserId) {
      throw new ForbiddenException(
        'Cannot create a conversation with yourself',
      );
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        members: {
          every: {
            userId: { in: [currentUserId, targetUserId] },
            leftAt: null,
          },
        },
      },
      include: this.conversationInclude,
    });

    if (existing) return this.mapConversation(existing);

    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        createdBy: currentUserId,
        members: {
          create: [
            { userId: currentUserId, role: 'MEMBER' },
            { userId: targetUserId, role: 'MEMBER' },
          ],
        },
      },
      include: this.conversationInclude,
    });

    return this.mapConversation(conversation);
  }

  async getConversations(currentUserId: string): Promise<ConversationInfo[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        members: {
          some: { userId: currentUserId, leftAt: null },
        },
      },
      include: this.conversationInclude,
      orderBy: { createdAt: 'desc' },
    });

    return conversations.map((c) => this.mapConversation(c));
  }

  async getConversation(
    conversationId: string,
    currentUserId: string,
  ): Promise<ConversationInfo> {
    await this.ensureMember(conversationId, currentUserId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: this.conversationInclude,
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    return this.mapConversation(conversation);
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ): Promise<MessageInfo> {
    await this.ensureMember(conversationId, senderId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    if (dto.replyToId) {
      const replyMsg = await this.prisma.message.findUnique({
        where: { id: dto.replyToId },
      });
      if (!replyMsg || replyMsg.conversationId !== conversationId) {
        throw new ForbiddenException(
          'Reply message not found in this conversation',
        );
      }
    }

    const attachedMediaValue =
      dto.attachments != null || dto.gameCard != null
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          { gameCard: dto.gameCard, attachments: dto.attachments ?? [] }
        : undefined;

    const message = await this.prisma.message.create({
      data: {
        sentBy: senderId,
        conversationId,
        replyToId: dto.replyToId ?? null,
        type:
          conversation.type === 'GROUP' ? 'GROUP_MESSAGE' : 'DIRECT_MESSAGE',
        messageText: dto.messageText ?? null,
        attachedMedia: attachedMediaValue,
      },
      include: {
        sender: {
          select: { id: true, username: true, profilePic: true },
        },
        replyTo: true,
      },
    });

    return {
      id: message.id,
      sentBy: message.sentBy,
      conversation: message.conversationId,
      replyTo: message.replyToId,
      type: message.type,
      messageText: message.messageText,
      attachedMedia: message.attachedMedia,
      sentAt: message.sentAt?.toISOString() ?? new Date().toISOString(),
      senderUsername: message.sender?.username ?? null,
      senderProfilePic: message.sender?.profilePic ?? null,
      replyToMessage: message.replyTo ?? undefined,
      gameCard:
        (message.attachedMedia as Record<string, unknown> | null)?.gameCard ??
        undefined,
    };
  }

  async deleteMessage(
    conversationId: string,
    messageId: string,
    senderId: string,
  ): Promise<void> {
    await this.ensureMember(conversationId, senderId);

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.sentBy !== senderId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.delete({ where: { id: messageId } });
  }

  private conversationInclude = {
    members: {
      where: { leftAt: null },
      include: {
        user: { select: { id: true, username: true, profilePic: true } },
      },
    },
    messages: {
      orderBy: { sentAt: 'asc' } as const,
      include: {
        sender: {
          select: { id: true, username: true, profilePic: true },
        },
        replyTo: true,
      },
    },
  };

  private mapConversation(conv: Record<string, unknown>): ConversationInfo {
    const members = (conv.members as Array<Record<string, unknown>>).map(
      (m: Record<string, unknown>) => ({
        id: m.id as string,
        userId: m.userId as string,
        conversation: m.conversationId as string,
        role: m.role as string,
        joinedAt:
          (
            m.joinedAt as { toISOString?: () => string } | null
          )?.toISOString?.() ?? null,
        leftAt:
          (
            m.leftAt as { toISOString?: () => string } | null
          )?.toISOString?.() ?? null,
        username: (m.user as Record<string, unknown> | null)?.username as
          | string
          | null,
        profilePic: (m.user as Record<string, unknown> | null)?.profilePic as
          | string
          | null,
      }),
    );

    const messages = (conv.messages as Array<Record<string, unknown>>).map(
      (msg: Record<string, unknown>) => ({
        id: msg.id as string,
        sentBy: msg.sentBy as string,
        conversation: msg.conversationId as string,
        replyTo: msg.replyToId as string | null,
        type: msg.type as string,
        messageText: msg.messageText as string | null,
        attachedMedia: msg.attachedMedia,
        sentAt:
          (
            msg.sentAt as { toISOString?: () => string } | null
          )?.toISOString?.() ?? null,
        senderUsername: (msg.sender as Record<string, unknown> | null)
          ?.username as string | null,
        senderProfilePic: (msg.sender as Record<string, unknown> | null)
          ?.profilePic as string | null,
        replyToMessage: msg.replyTo,
        gameCard:
          (msg.attachedMedia as Record<string, unknown> | null)?.gameCard ??
          undefined,
      }),
    );

    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

    return {
      id: conv.id as string,
      name: conv.name as string | null,
      groupPicture: conv.groupPicture as string | null,
      createdBy: conv.createdBy as string,
      createdAt:
        (
          conv.createdAt as { toISOString?: () => string } | null
        )?.toISOString?.() ?? null,
      isGroup: conv.type === 'GROUP',
      memberCount: members.length,
      lastMessage: lastMsg?.messageText ?? null,
      lastMessageTime: lastMsg?.sentAt ?? null,
      lastMessageSender: lastMsg?.senderUsername ?? null,
      members,
      messages,
    };
  }
}
