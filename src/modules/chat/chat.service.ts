import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import Valkey from 'iovalkey';
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
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('VALKEY_CLIENT') private valkey: Valkey,
  ) {}


  async ensureMember(conversationId: string, userId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { conversationId, userId, leftAt: null },
    });
    if (!member) {
      throw new ForbiddenException({
        code: 'NOT_CONVERSATION_MEMBER',
        message: 'No eres miembro de esta conversación',
      });
    }
    return member;
  }

  async createDirectConversation(
    currentUserId: string,
    targetUserId: string,
  ): Promise<ConversationInfo> {
    if (currentUserId === targetUserId) {
      throw new ForbiddenException({
        code: 'CANNOT_CHAT_SELF',
        message: 'No puedes crear una conversación contigo mismo',
      });
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

  async searchChatUsers(currentUserId: string, query?: string): Promise<any[]> {
    const follows = await this.prisma.follow.findMany({
      where: {
        followerId: currentUserId,
        followedType: 'USER',
      },
      select: {
        followedId: true,
      },
    });
    const followedUserIds = follows.map((f) => f.followedId);

    if (followedUserIds.length === 0) return [];

    const existingConversations = await this.prisma.conversation.findMany({
      where: {
        type: 'DIRECT',
        members: {
          some: {
            userId: currentUserId,
            leftAt: null,
          },
        },
      },
      include: {
        members: true,
      },
    });

    const existingChatUserIds = new Set<string>();
    for (const conv of existingConversations) {
      for (const member of conv.members) {
        if (member.userId !== currentUserId) {
          existingChatUserIds.add(member.userId);
        }
      }
    }

    const availableUserIds = followedUserIds.filter(
      (id) => !existingChatUserIds.has(id),
    );

    if (availableUserIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: availableUserIds },
        ...(query
          ? {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        profilePic: true,
      },
      take: 20,
    });

    return users;
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
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, username: true, profilePic: true } },
          },
        },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    let messages: MessageInfo[] = [];
    const cacheKey = `chat:conversation:${conversationId}:messages`;

    try {
      const cached = await this.valkey.zrange(cacheKey, '0', '-1');

      if (cached && cached.length > 0) {
        messages = cached.map((c) => JSON.parse(c) as MessageInfo);
      } else {
        const dbMessages = await this.prisma.message.findMany({
          where: { conversationId },
          orderBy: { sentAt: 'asc' },
          take: 100,
          include: {
            sender: {
              select: { id: true, username: true, profilePic: true },
            },
            replyTo: true,
          },
        });

        messages = dbMessages.map((msg) => ({
          id: msg.id,
          sentBy: msg.sentBy,
          conversation: msg.conversationId,
          replyTo: msg.replyToId,
          type: msg.type,
          messageText: msg.messageText,
          attachedMedia: (msg.attachedMedia as Record<string, any> | null)?.attachments ?? [],
          sentAt: msg.sentAt?.toISOString() ?? new Date().toISOString(),
          senderUsername: msg.sender?.username ?? null,
          senderProfilePic: msg.sender?.profilePic ?? null,
          replyToMessage: msg.replyTo ?? undefined,
          gameCard: (msg.attachedMedia as Record<string, unknown> | null)?.gameCard ?? undefined,
        }));

        if (messages.length > 0) {
          const pipeline = this.valkey.pipeline();
          messages.forEach((msg) => {
            const score = msg.sentAt ? new Date(msg.sentAt).getTime() : Date.now();
            pipeline.zadd(cacheKey, score, JSON.stringify(msg));
          });
          pipeline.expire(cacheKey, 86400); // 24 hours TTL
          await pipeline.exec();
        }
      }
    } catch (err) {
      this.logger.error(`Error with Valkey cache in getConversation: ${err.message}`);
      const dbMessages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { sentAt: 'asc' },
        include: {
          sender: {
            select: { id: true, username: true, profilePic: true },
          },
          replyTo: true,
        },
      });
      messages = dbMessages.map((msg) => ({
        id: msg.id,
        sentBy: msg.sentBy,
        conversation: msg.conversationId,
        replyTo: msg.replyToId,
        type: msg.type,
        messageText: msg.messageText,
        attachedMedia: (msg.attachedMedia as Record<string, any> | null)?.attachments ?? [],
        sentAt: msg.sentAt?.toISOString() ?? new Date().toISOString(),
        senderUsername: msg.sender?.username ?? null,
        senderProfilePic: msg.sender?.profilePic ?? null,
        replyToMessage: msg.replyTo ?? undefined,
        gameCard: (msg.attachedMedia as Record<string, unknown> | null)?.gameCard ?? undefined,
      }));
    }

    const mapped = this.mapConversation({ ...conversation, messages: [] });
    mapped.messages = messages;

    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      mapped.lastMessage = lastMsg.messageText;
      mapped.lastMessageTime = lastMsg.sentAt;
      mapped.lastMessageSender = lastMsg.senderUsername;
    }

    return mapped;
  }


  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ): Promise<MessageInfo> {
    await this.ensureMember(conversationId, senderId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.type === 'DIRECT') {
      const otherMember = conversation.members.find(
        (m) => m.userId !== senderId,
      );
      if (otherMember) {
        const isBlocked = await this.isUserBlocked(
          senderId,
          otherMember.userId,
        );
        const hasBlockedMe = await this.isUserBlocked(
          otherMember.userId,
          senderId,
        );
        if (isBlocked || hasBlockedMe) {
          throw new ForbiddenException(
            'Cannot send message: one of the users has blocked the other',
          );
        }
      }
    }

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

    const messageInfo: MessageInfo = {
      id: message.id,
      sentBy: message.sentBy,
      conversation: message.conversationId,
      replyTo: message.replyToId,
      type: message.type,
      messageText: message.messageText,
      attachedMedia: (message.attachedMedia as Record<string, any> | null)?.attachments ?? [],
      sentAt: message.sentAt?.toISOString() ?? new Date().toISOString(),
      senderUsername: message.sender?.username ?? null,
      senderProfilePic: message.sender?.profilePic ?? null,
      replyToMessage: message.replyTo ?? undefined,
      gameCard:
        (message.attachedMedia as Record<string, unknown> | null)?.gameCard ??
        undefined,
    };

    const cacheKey = `chat:conversation:${conversationId}:messages`;
    try {
      const cacheExists = await this.valkey.exists(cacheKey);
      if (cacheExists === 1) {
        const score = message.sentAt ? new Date(message.sentAt).getTime() : Date.now();
        const pipeline = this.valkey.pipeline();
        pipeline.zadd(cacheKey, score, JSON.stringify(messageInfo));
        pipeline.zremrangebyrank(cacheKey, '0', '-101'); // Retain only 100 most recent

        pipeline.expire(cacheKey, 86400); // 24 hours TTL
        await pipeline.exec();
      }
    } catch (err) {
      this.logger.error(`Error caching message in Valkey: ${err.message}`);
    }

    return messageInfo;

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

    try {
      const cacheKey = `chat:conversation:${conversationId}:messages`;
      await this.valkey.del(cacheKey);
    } catch (err) {
      this.logger.error(`Error deleting cache key in Valkey: ${err.message}`);
    }
  }

  async clearConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.ensureMember(conversationId, userId);
    await this.prisma.message.deleteMany({
      where: { conversationId },
    });

    try {
      const cacheKey = `chat:conversation:${conversationId}:messages`;
      await this.valkey.del(cacheKey);
    } catch (err) {
      this.logger.error(`Error deleting cache key in Valkey: ${err.message}`);
    }
  }


  async blockUser(userId: string, targetUserId: string): Promise<void> {
    if (userId === targetUserId) {
      throw new ForbiddenException({
        code: 'CANNOT_BLOCK_SELF',
        message: 'No puedes bloquearte a ti mismo',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accountSettings: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) throw new NotFoundException('Target user not found');

    const settings = (user.accountSettings as Record<string, any>) || {};
    const blockedUsers = new Set<string>(
      Array.isArray(settings.blockedUserIds)
        ? (settings.blockedUserIds as string[])
        : [],
    );
    blockedUsers.add(targetUserId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountSettings: {
          ...settings,
          blockedUserIds: Array.from(blockedUsers),
        },
      },
    });
  }

  async unblockUser(userId: string, targetUserId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accountSettings: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const settings = (user.accountSettings as Record<string, any>) || {};
    const blockedUsers = new Set<string>(
      Array.isArray(settings.blockedUserIds)
        ? (settings.blockedUserIds as string[])
        : [],
    );
    blockedUsers.delete(targetUserId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountSettings: {
          ...settings,
          blockedUserIds: Array.from(blockedUsers),
        },
      },
    });
  }

  async isUserBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accountSettings: true },
    });
    if (!user || !user.accountSettings) return false;
    const settings = user.accountSettings as Record<string, any>;
    const blockedUsers = settings.blockedUserIds || [];
    return Array.isArray(blockedUsers) && blockedUsers.includes(targetUserId);
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
        displayName: (m.user as Record<string, unknown> | null)?.displayName as
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
        attachedMedia: (msg.attachedMedia as Record<string, any> | null)?.attachments ?? [],
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
