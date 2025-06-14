import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { MessagesService } from '../services/messages.service';
import { MessageRequestService } from '../services/message-request.service';
import {
  SendMessageDto,
  MessageListDto,
  ConversationListDto,
  ConversationFilterDto,
  MessageFilterDto,
  UpdateConversationDto,
  CreateMessageRequestDto,
  MessageRequestListDto,
  MessageRequestFilterDto,
  RespondToMessageRequestDto,
  MarkAsReadDto,
  MessageRequestDto,
  ConversationDto,
} from '../dtos/message.dto';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messageRequestService: MessageRequestService,
  ) {}

  // Conversation endpoints
  @Get('conversations')
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Get user conversations',
    description:
      'Retrieve list of conversations for the current user with pagination and filtering',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversations retrieved successfully',
    type: ConversationListDto,
  })
  async getConversations(
    @CurrentUser() user: any,
    @Query() filters: ConversationFilterDto,
  ): Promise<ConversationListDto> {
    return this.messagesService.getUserConversations(user.id, filters);
  }

  @Get('conversations/:conversationId')
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Get conversation details',
    description: 'Retrieve details of a specific conversation',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation details retrieved successfully',
    type: ConversationDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to conversation',
  })
  async getConversation(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    await this.messagesService.verifyConversationAccess(
      conversationId,
      user.id,
    );
    // Implementation would fetch and format conversation details
    return { message: 'Conversation details' };
  }

  @Put('conversations/:conversationId')
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Update conversation settings',
    description: 'Update conversation status, archive/unarchive, etc.',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation updated successfully',
  })
  async updateConversation(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() updateDto: UpdateConversationDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    const conversation = await this.messagesService.updateConversation(
      conversationId,
      user.id,
      updateDto,
    );
    return { message: 'Conversation updated successfully', conversation };
  }

  // Message endpoints
  @Get('conversations/:conversationId/messages')
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Get messages in conversation',
    description:
      'Retrieve paginated list of messages in a specific conversation',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages retrieved successfully',
    type: MessageListDto,
  })
  async getMessages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() filters: MessageFilterDto,
    @CurrentUser() user: any,
  ): Promise<MessageListDto> {
    return this.messagesService.getConversationMessages(
      conversationId,
      user.id,
      filters,
    );
  }

  @Post('conversations/:conversationId/messages')
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Send message',
    description:
      'Send a message in a conversation (Note: Real-time sending should use WebSocket)',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Message sent successfully',
  })
  async sendMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() sendMessageDto: Omit<SendMessageDto, 'conversationId'>,
    @CurrentUser() user: any,
  ): Promise<any> {
    const message = await this.messagesService.sendMessage(user.id, {
      ...sendMessageDto,
      conversationId,
    });

    const messageDto = await this.messagesService.formatMessageToDto(message);
    return { message: 'Message sent successfully', data: messageDto };
  }

  @Put('conversations/:conversationId/messages/read')
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Mark messages as read',
    description: 'Mark specific messages or entire conversation as read',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages marked as read successfully',
  })
  async markMessagesAsRead(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() markAsReadDto: MarkAsReadDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    if (markAsReadDto.messageIds.length === 0) {
      // Mark entire conversation as read
      await this.messagesService.markConversationAsRead(
        conversationId,
        user.id,
      );
    } else {
      // Mark specific messages as read
      await this.messagesService.markMessagesAsRead(
        markAsReadDto.messageIds,
        user.id,
      );
    }

    return { message: 'Messages marked as read successfully' };
  }

  // Message Request endpoints
  @Post('requests')
  @Roles(UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Send message request to coach',
    description: 'Trainee sends a request to start messaging with a coach',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Message request sent successfully',
    type: MessageRequestDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request or already pending request exists',
  })
  async sendMessageRequest(
    @Body() createDto: CreateMessageRequestDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    const request = await this.messageRequestService.createMessageRequest(
      user.id,
      createDto,
    );
    const requestDto =
      await this.messageRequestService.formatRequestToDto(request);

    return {
      message: 'Message request sent successfully',
      data: requestDto,
    };
  }

  @Get('requests/sent')
  @Roles(UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Get sent message requests',
    description: 'Get list of message requests sent by the trainee',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sent requests retrieved successfully',
    type: MessageRequestListDto,
  })
  async getSentMessageRequests(
    @CurrentUser() user: any,
    @Query() filters: MessageRequestFilterDto,
  ): Promise<MessageRequestListDto> {
    return this.messageRequestService.getTraineeMessageRequests(
      user.id,
      filters,
    );
  }

  @Get('requests/received')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get received message requests',
    description: 'Get list of message requests received by the coach',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Received requests retrieved successfully',
    type: MessageRequestListDto,
  })
  async getReceivedMessageRequests(
    @CurrentUser() user: any,
    @Query() filters: MessageRequestFilterDto,
  ): Promise<MessageRequestListDto> {
    return this.messageRequestService.getCoachMessageRequests(user.id, filters);
  }

  @Put('requests/:requestId/respond')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Respond to message request',
    description: 'Coach accepts or rejects a message request from trainee',
  })
  @ApiParam({
    name: 'requestId',
    description: 'Message request ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request responded successfully',
    type: MessageRequestDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message request not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Request already responded or expired',
  })
  async respondToMessageRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() response: RespondToMessageRequestDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    const request = await this.messageRequestService.respondToMessageRequest(
      requestId,
      user.id,
      response,
    );

    const requestDto =
      await this.messageRequestService.formatRequestToDto(request);

    return {
      message: `Request ${response.action}ed successfully`,
      data: requestDto,
    };
  }

  @Get('requests/:requestId')
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Get message request details',
    description: 'Get details of a specific message request',
  })
  @ApiParam({
    name: 'requestId',
    description: 'Message request ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request details retrieved successfully',
    type: MessageRequestDto,
  })
  async getMessageRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    const request = await this.messageRequestService.getMessageRequest(
      requestId,
      user.id,
    );
    const requestDto =
      await this.messageRequestService.formatRequestToDto(request);

    return { data: requestDto };
  }

  @Delete('requests/:requestId')
  @Roles(UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Cancel message request',
    description: 'Trainee cancels a pending message request',
  })
  @ApiParam({
    name: 'requestId',
    description: 'Message request ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request cancelled successfully',
  })
  async cancelMessageRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    await this.messageRequestService.cancelMessageRequest(requestId, user.id);
    return { message: 'Message request cancelled successfully' };
  }

  // Statistics endpoints
  @Get('stats/conversations')
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Get conversation statistics',
    description: 'Get conversation statistics for the current user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalConversations: { type: 'number' },
        unreadConversations: { type: 'number' },
        totalUnreadMessages: { type: 'number' },
        activeConversations: { type: 'number' },
      },
    },
  })
  async getConversationStats(@CurrentUser() user: any): Promise<any> {
    const stats = await this.messagesService.getConversationStats(user.id);
    return { data: stats };
  }

  @Get('stats/requests')
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Get message request statistics',
    description: 'Get message request statistics for the current user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalRequests: { type: 'number' },
        pendingRequests: { type: 'number' },
        acceptedRequests: { type: 'number' },
        rejectedRequests: { type: 'number' },
        expiredRequests: { type: 'number' },
      },
    },
  })
  async getMessageRequestStats(@CurrentUser() user: any): Promise<any> {
    const stats = await this.messageRequestService.getMessageRequestStats(
      user.id,
      user.role,
    );
    return { data: stats };
  }
}
