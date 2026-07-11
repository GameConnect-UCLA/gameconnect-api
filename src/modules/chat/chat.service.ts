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

    const result = this.mapConversation(conversation);
    const clearedAt = await this.getClearedAt(currentUserId, conversationId);

    if (clearedAt) {
      result.messages = result.messages.filter(
        (m) => m.sentAt != null && m.sentAt > clearedAt,
      );
      const lastMsg =
        result.messages.length > 0
          ? result.messages[result.messages.length - 1]
          : null;
      result.lastMessage = lastMsg?.messageText ?? null;
      result.lastMessageTime = lastMsg?.sentAt ?? null;
    }

    return result;
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

    if (conversation.type === 'DIRECT') {
      const otherMembers = await this.prisma.groupMember.findMany({
        where: { conversationId, userId: { not: senderId }, leftAt: null },
      });
      if (otherMembers.length > 0) {
        const blocked = await this.isBlocked(senderId, otherMembers[0].userId);
        if (blocked) {
          throw new ForbiddenException('You cannot message this user');
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

  async getMemberRole(
    conversationId: string,
    userId: string,
  ): Promise<string | null> {
    const member = await this.prisma.groupMember.findFirst({
      where: { conversationId, userId, leftAt: null },
    });
    return member?.role ?? null;
  }

  async createGroup(
    name: string,
    groupPic: string | null,
    memberIds: string[],
    ownerId: string,
  ): Promise<ConversationInfo> {
    const uniqueIds = [...new Set([...memberIds, ownerId])].filter(
      (id) => id !== ownerId,
    );

    const conversation = await this.prisma.conversation.create({
      data: {
        name,
        groupPicture: groupPic,
        type: 'GROUP',
        createdBy: ownerId,
        members: {
          create: [
            { userId: ownerId, role: 'OWNER' },
            ...uniqueIds.map((id) => ({ userId: id, role: 'MEMBER' as const })),
          ],
        },
      },
      include: this.conversationInclude,
    });

    return this.mapConversation(conversation);
  }

  async addMember(conversationId: string, adminId: string, userId: string) {
    const role = await this.getMemberRole(conversationId, adminId);
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can add members');
    }

    const existing = await this.prisma.groupMember.findFirst({
      where: { conversationId, userId, leftAt: null },
    });
    if (existing) return { success: true };

    await this.prisma.groupMember.create({
      data: { conversationId, userId, role: 'MEMBER' },
    });

    return { success: true };
  }

  async removeMember(
    conversationId: string,
    adminId: string,
    memberId: string,
  ) {
    const adminRole = await this.getMemberRole(conversationId, adminId);
    if (adminRole !== 'OWNER' && adminRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can remove members');
    }

    const member = await this.prisma.groupMember.findFirst({
      where: { id: memberId, conversationId, leftAt: null },
    });
    if (!member) throw new NotFoundException('Member not found');

    const memberRole = await this.getMemberRole(conversationId, member.userId);
    if (memberRole === 'OWNER') {
      throw new ForbiddenException('Cannot remove the group owner');
    }
    if (adminRole === 'ADMIN' && memberRole === 'ADMIN') {
      throw new ForbiddenException('Admins cannot remove other admins');
    }

    await this.prisma.groupMember.update({
      where: { id: memberId },
      data: { leftAt: new Date() },
    });

    return { success: true };
  }

  async promoteMember(
    conversationId: string,
    adminId: string,
    memberId: string,
  ) {
    const adminRole = await this.getMemberRole(conversationId, adminId);
    if (adminRole !== 'OWNER') {
      throw new ForbiddenException('Only the owner can promote members');
    }

    const member = await this.prisma.groupMember.findFirst({
      where: { id: memberId, conversationId, leftAt: null },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.userId === adminId) {
      throw new ForbiddenException('Cannot promote yourself');
    }
    if (member.role === 'ADMIN' || member.role === 'OWNER') {
      throw new ForbiddenException('Member is already admin or owner');
    }

    await this.prisma.groupMember.update({
      where: { id: memberId },
      data: { role: 'ADMIN' },
    });

    return { success: true };
  }

  async demoteMember(
    conversationId: string,
    adminId: string,
    memberId: string,
  ) {
    const adminRole = await this.getMemberRole(conversationId, adminId);
    if (adminRole !== 'OWNER') {
      throw new ForbiddenException('Only the owner can demote members');
    }

    const member = await this.prisma.groupMember.findFirst({
      where: { id: memberId, conversationId, leftAt: null },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.userId === adminId) {
      throw new ForbiddenException('Cannot demote yourself');
    }
    if (member.role !== 'ADMIN') {
      throw new ForbiddenException('Member is not an admin');
    }

    await this.prisma.groupMember.update({
      where: { id: memberId },
      data: { role: 'MEMBER' },
    });

    return { success: true };
  }

  async transferOwnership(
    conversationId: string,
    ownerId: string,
    newOwnerId: string,
  ) {
    const ownerRole = await this.getMemberRole(conversationId, ownerId);
    if (ownerRole !== 'OWNER') {
      throw new ForbiddenException('Only the owner can transfer ownership');
    }

    const newOwner = await this.prisma.groupMember.findFirst({
      where: { id: newOwnerId, conversationId, leftAt: null },
    });
    if (!newOwner) throw new NotFoundException('Target member not found');
    if (newOwner.userId === ownerId) {
      throw new ForbiddenException('Already the owner');
    }

    await this.prisma.$transaction([
      this.prisma.groupMember.update({
        where: { id: newOwner.id },
        data: { role: 'OWNER' },
      }),
      this.prisma.groupMember.updateMany({
        where: { conversationId, userId: ownerId },
        data: { role: 'ADMIN' },
      }),
    ]);

    return { success: true };
  }

  async leaveGroup(conversationId: string, userId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { conversationId, userId, leftAt: null },
    });
    if (!member) throw new ForbiddenException('Not a member of this group');

    const activeMembers = await this.prisma.groupMember.count({
      where: { conversationId, leftAt: null },
    });

    if (activeMembers === 1) {
      await this.prisma.conversation.delete({
        where: { id: conversationId },
      });
      return { success: true, deleted: true };
    }

    if (member.role === 'OWNER') {
      const nextOwner = await this.prisma.groupMember.findFirst({
        where: { conversationId, leftAt: null, role: 'ADMIN' },
        orderBy: { joinedAt: 'asc' },
      });

      if (nextOwner) {
        await this.prisma.groupMember.update({
          where: { id: nextOwner.id },
          data: { role: 'OWNER' },
        });
      } else {
        const oldestMember = await this.prisma.groupMember.findFirst({
          where: { conversationId, leftAt: null, userId: { not: userId } },
          orderBy: { joinedAt: 'asc' },
        });
        if (oldestMember) {
          await this.prisma.groupMember.update({
            where: { id: oldestMember.id },
            data: { role: 'OWNER' },
          });
        }
      }
    }

    await this.prisma.groupMember.update({
      where: { id: member.id },
      data: { leftAt: new Date() },
    });

    return { success: true };
  }

  async blockUser(currentUserId: string, targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const settings =
      (user.accountSettings as Record<string, unknown> | null) ?? {};
    const blockedIds = (settings.blockedUserIds as string[]) ?? [];
    if (!blockedIds.includes(targetUserId)) {
      blockedIds.push(targetUserId);
    }

    await this.prisma.user.update({
      where: { id: currentUserId },
      data: {
        accountSettings: { ...settings, blockedUserIds: blockedIds },
      },
    });

    return { success: true };
  }

  async unblockUser(currentUserId: string, targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const settings =
      (user.accountSettings as Record<string, unknown> | null) ?? {};
    const blockedIds = (settings.blockedUserIds as string[]) ?? [];

    await this.prisma.user.update({
      where: { id: currentUserId },
      data: {
        accountSettings: {
          ...settings,
          blockedUserIds: blockedIds.filter(
            (id: string) => id !== targetUserId,
          ),
        },
      },
    });

    return { success: true };
  }

  async isBlocked(userA: string, userB: string): Promise<boolean> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: [userA, userB] } },
      select: { id: true, accountSettings: true },
    });

    for (const u of users) {
      const settings = u.accountSettings as Record<string, unknown> | null;
      const blockedIds = (settings?.blockedUserIds as string[]) ?? [];
      const otherUserId = u.id === userA ? userB : userA;
      if (blockedIds.includes(otherUserId)) return true;
    }

    return false;
  }

  async clearChatHistory(conversationId: string, userId: string) {
    await this.ensureMember(conversationId, userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const settings =
      (user.accountSettings as Record<string, unknown> | null) ?? {};
    const cleared =
      (settings.clearedConversations as Record<string, string>) ?? {};

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountSettings: {
          ...settings,
          clearedConversations: {
            ...cleared,
            [conversationId]: new Date().toISOString(),
          },
        },
      },
    });

    return { success: true };
  }

  private async getClearedAt(
    userId: string,
    conversationId: string,
  ): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accountSettings: true },
    });
    const settings = user?.accountSettings as Record<string, unknown> | null;
    const cleared =
      (settings?.clearedConversations as Record<string, string>) ?? {};
    return cleared[conversationId] ?? null;
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
