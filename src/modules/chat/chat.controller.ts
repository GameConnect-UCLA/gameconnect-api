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
import { CreateGroupDto } from './dto/create-group.dto';
import { MemberActionDto } from './dto/member-action.dto';
import { BlockUserDto } from './dto/block-user.dto';

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

  @Post('groups')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a group conversation' })
  async createGroup(
    @Body() dto: CreateGroupDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.createGroup(
      dto.name,
      dto.groupPic ?? null,
      dto.memberIds,
      req.user.userId,
    );
  }

  @Post('groups/add-member')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a member to a group' })
  async addMember(
    @Body() dto: MemberActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.addMember(
      dto.conversationId,
      req.user.userId,
      dto.userId as string,
    );
  }

  @Post('groups/remove-member')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a member from a group' })
  async removeMember(
    @Body() dto: MemberActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.removeMember(
      dto.conversationId,
      req.user.userId,
      dto.memberId as string,
    );
  }

  @Post('groups/promote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Promote a member to admin' })
  async promoteMember(
    @Body() dto: MemberActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.promoteMember(
      dto.conversationId,
      req.user.userId,
      dto.memberId as string,
    );
  }

  @Post('groups/demote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Demote an admin to member' })
  async demoteMember(
    @Body() dto: MemberActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.demoteMember(
      dto.conversationId,
      req.user.userId,
      dto.memberId as string,
    );
  }

  @Post('groups/transfer-ownership')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer group ownership' })
  async transferOwnership(
    @Body() dto: MemberActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.transferOwnership(
      dto.conversationId,
      req.user.userId,
      dto.memberId as string,
    );
  }

  @Post('groups/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a group conversation' })
  async leaveGroup(
    @Body() dto: MemberActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.leaveGroup(dto.conversationId, req.user.userId);
  }

  @Post('users/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(@Body() dto: BlockUserDto, @Req() req: AuthenticatedRequest) {
    return this.chatService.blockUser(req.user.userId, dto.userId);
  }

  @Post('users/unblock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(
    @Body() dto: BlockUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.unblockUser(req.user.userId, dto.userId);
  }

  @Post('conversations/clear')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear chat history for a conversation' })
  async clearHistory(
    @Body() dto: MemberActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.clearChatHistory(
      dto.conversationId,
      req.user.userId,
    );
  }
}
