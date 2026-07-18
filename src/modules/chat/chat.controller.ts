import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { StartConversationDto } from './dto/start-conversation.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    authId: string;
  };
}

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current user conversations' })
  async getConversations(@Req() req: AuthenticatedRequest) {
    return this.chatService.getConversations(req.user.userId);
  }

  @Get('conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single conversation with messages' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  async getConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.getConversation(id, req.user.userId);
  }

  @Post('conversations/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message in a conversation' })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.sendMessage(
      dto.conversationId,
      req.user.userId,
      dto,
    );
  }

  @Post('conversations/delete-message')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a message' })
  async deleteMessage(
    @Body() dto: DeleteMessageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.chatService.deleteMessage(
      dto.conversationId,
      dto.messageId,
      req.user.userId,
    );
    return { success: true };
  }

  @Post('conversations/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start or find a direct conversation with a user' })
  async startConversation(
    @Body() dto: StartConversationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.createDirectConversation(
      req.user.userId,
      dto.userId,
    );
  }
}
