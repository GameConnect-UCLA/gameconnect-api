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

interface JwtPayload {
  sub: string;
  authId: string;
}

type AuthSocket = Socket & { userId: string };

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const token: string | undefined = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload: JwtPayload = this.jwtService.verify(token);
      (client as AuthSocket).userId = payload.sub;
      this.addOnlineUser(payload.sub, client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as AuthSocket).userId;
    if (userId) {
      this.removeOnlineUser(userId, client.id);
    }
  }

  private addOnlineUser(userId: string, socketId: string) {
    const sockets = this.onlineUsers.get(userId);
    if (!sockets || sockets.size === 0) {
      this.onlineUsers.set(userId, new Set([socketId]));
      this.server.emit('user:online', { userId });
    } else {
      sockets.add(socketId);
    }
  }

  private removeOnlineUser(userId: string, socketId: string) {
    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
      this.server.emit('user:offline', { userId });
    }
  }

  @SubscribeMessage('room:join')
  async handleRoomJoin(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    try {
      await this.chatService.ensureMember(data.conversation_id, client.userId);
      void client.join(data.conversation_id);
    } catch {
      client.emit('error', { message: 'Cannot join this conversation' });
    }
  }

  @SubscribeMessage('room:leave')
  handleRoomLeave(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    void client.leave(data.conversation_id);
  }

  @SubscribeMessage('message:send')
  async handleMessageSend(
    @ConnectedSocket() client: AuthSocket,
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
    } catch (err) {
      client.emit('error', {
        message: err instanceof Error ? err.message : 'Failed to send message',
      });
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    try {
      await this.chatService.ensureMember(data.conversation_id, client.userId);
      client
        .to(data.conversation_id)
        .emit('typing:update', { userId: client.userId, isTyping: true });
    } catch {
      client.emit('error', { message: 'Cannot send typing event' });
    }
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    try {
      await this.chatService.ensureMember(data.conversation_id, client.userId);
      client
        .to(data.conversation_id)
        .emit('typing:update', { userId: client.userId, isTyping: false });
    } catch {
      client.emit('error', { message: 'Cannot send typing event' });
    }
  }
}
