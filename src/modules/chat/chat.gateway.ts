import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { Logger } from '@nestjs/common';

interface JwtPayload {
  sub: string;
  authId: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private activeConnections = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client trying to connect: ${client.id}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const token: string | undefined = client.handshake.auth?.token;
    if (!token) {
      this.logger.warn(`Client ${client.id} rejected: No token provided`);
      client.disconnect();
      return;
    }

    try {
      const payload: JwtPayload = this.jwtService.verify(token);
      const userId = payload.sub;
      (client as Socket & { userId: string }).userId = userId;

      let sockets = this.activeConnections.get(userId);
      const isFirstConnection = !sockets || sockets.size === 0;
      if (!sockets) {
        sockets = new Set<string>();
        this.activeConnections.set(userId, sockets);
      }
      sockets.add(client.id);

      this.logger.log(
        `Client connected successfully: ${client.id} (user: ${userId})`,
      );

      // Automatically join all user's conversation rooms and broadcast online status
      void this.chatService
        .getConversations(userId)
        .then((conversations) => {
          this.logger.log(
            `User ${userId} automatically joined ${conversations.length} conversation rooms`,
          );
          for (const conv of conversations) {
            void client.join(conv.id);
            if (isFirstConnection) {
              this.server.to(conv.id).emit('user:online', { userId });
            }
          }
        })
        .catch((err) => {
          this.logger.error(
            'Failed to load conversations for new connection:',
            err,
          );
        });
    } catch (err: any) {
      this.logger.warn(
        `Client ${client.id} rejected: Token validation failed: ${err.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as Socket & { userId: string }).userId;
    if (!userId) return;

    this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);

    const sockets = this.activeConnections.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.activeConnections.delete(userId);

        // Broadcast offline status to all user's conversations
        void this.chatService
          .getConversations(userId)
          .then((conversations) => {
            for (const conv of conversations) {
              this.server.to(conv.id).emit('user:offline', { userId });
            }
          })
          .catch((err) => {
            this.logger.error('Failed to load conversations for disconnect:', err);
          });
      }
    }
  }

  @SubscribeMessage('room:join')
  async handleRoomJoin(
    @ConnectedSocket() client: Socket & { userId: string },
    @MessageBody() data: { conversation_id: string },
  ) {
    try {
      this.logger.log(
        `WS: User ${client.userId} joining room ${data.conversation_id}`,
      );
      await this.chatService.ensureMember(data.conversation_id, client.userId);
      void client.join(data.conversation_id);
    } catch (err: any) {
      this.logger.warn(
        `WS: User ${client.userId} failed to join room ${data.conversation_id}: ${err.message}`,
      );
      client.emit('error', { message: 'Cannot join this conversation' });
    }
  }

  @SubscribeMessage('room:leave')
  handleRoomLeave(
    @ConnectedSocket() client: Socket & { userId: string },
    @MessageBody() data: { conversation_id: string },
  ) {
    this.logger.log(
      `WS: User ${client.userId} leaving room ${data.conversation_id}`,
    );
    void client.leave(data.conversation_id);
  }

  @SubscribeMessage('message:send')
  async handleMessageSend(
    @ConnectedSocket() client: Socket & { userId: string },
    @MessageBody()
    data: {
      conversation_id: string;
      messageText?: string;
      attachments?: unknown[];
      replyTo?: string;
      gameCard?: unknown;
    },
  ) {
    try {
      this.logger.log(
        `WS: Received message:send from user ${client.userId} in room ${data.conversation_id}: "${data.messageText ?? ''}"`,
      );
      const message = await this.chatService.sendMessage(
        data.conversation_id,
        client.userId,
        {
          conversationId: data.conversation_id,
          messageText: data.messageText ?? undefined,
          attachments:
            (data.attachments as Record<string, unknown>[] | undefined) ??
            undefined,
          replyToId: data.replyTo ?? undefined,
          gameCard:
            (data.gameCard as Record<string, unknown> | undefined) ?? undefined,
        },
      );

      this.server.to(data.conversation_id).emit('message:new', message);
      this.logger.log(
        `WS: Broadcasted message:new ${message.id} to room ${data.conversation_id}`,
      );
    } catch (err: any) {
      this.logger.error(
        `WS: Failed to send message in room ${data.conversation_id} by user ${client.userId}: ${err.message}`,
      );
      client.emit('error', {
        message: err instanceof Error ? err.message : 'Failed to send message',
      });
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket & { userId: string },
    @MessageBody() data: { conversation_id: string },
  ) {
    client.to(data.conversation_id).emit('typing:update', {
      userId: client.userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket & { userId: string },
    @MessageBody() data: { conversation_id: string },
  ) {
    client.to(data.conversation_id).emit('typing:update', {
      userId: client.userId,
      isTyping: false,
    });
  }
}
