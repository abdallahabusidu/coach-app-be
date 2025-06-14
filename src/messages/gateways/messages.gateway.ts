import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  CreateMessageRequestDto,
  JoinRoomDto,
  RespondToMessageRequestDto,
  SendMessageDto,
  TypingIndicatorDto,
} from '../dtos/message.dto';
import { MessageRequestService } from '../services/message-request.service';
import { MessagesService } from '../services/messages.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private userSockets = new Map<string, AuthenticatedSocket>(); // socketId -> socket
  private typingUsers = new Map<string, Set<string>>(); // conversationId -> Set of userIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
    private readonly messageRequestService: MessageRequestService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(socket: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new WsException('No token provided');
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      socket.userId = payload.sub;
      socket.userRole = payload.role;

      // Track connected user
      if (!this.connectedUsers.has(socket.userId)) {
        this.connectedUsers.set(socket.userId, new Set());
      }
      this.connectedUsers.get(socket.userId)!.add(socket.id);
      this.userSockets.set(socket.id, socket);

      // Update user online status
      await this.updateUserOnlineStatus(socket.userId, true);

      this.logger.log(
        `User ${socket.userId} connected with socket ${socket.id}`,
      );

      // Emit user online status to relevant conversations
      await this.notifyUserStatusChange(socket.userId, true);
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: AuthenticatedSocket) {
    if (socket.userId) {
      // Remove socket from tracking
      const userSockets = this.connectedUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(socket.userId);
          // Update user offline status
          await this.updateUserOnlineStatus(socket.userId, false);
          await this.notifyUserStatusChange(socket.userId, false);
        }
      }
      this.userSockets.delete(socket.id);

      // Remove from typing indicators
      this.typingUsers.forEach((typingUsersInConversation, conversationId) => {
        if (typingUsersInConversation.has(socket.userId!)) {
          typingUsersInConversation.delete(socket.userId!);
          this.notifyTypingStatusChange(conversationId, socket.userId!, false);
        }
      });

      this.logger.log(`User ${socket.userId} disconnected`);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    try {
      // Verify user has access to this conversation
      const hasAccess = await this.messagesService.verifyConversationAccess(
        data.conversationId,
        socket.userId!,
      );

      if (!hasAccess) {
        throw new WsException('Access denied to conversation');
      }

      // Join the conversation room
      await socket.join(data.conversationId);

      this.logger.log(
        `User ${socket.userId} joined conversation ${data.conversationId}`,
      );

      // Mark messages as read when joining
      await this.messagesService.markConversationAsRead(
        data.conversationId,
        socket.userId!,
      );

      // Notify other participants that user is online in this conversation
      socket.to(data.conversationId).emit('user_joined_conversation', {
        userId: socket.userId,
        conversationId: data.conversationId,
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    await socket.leave(data.conversationId);

    // Stop typing if user was typing
    this.handleStopTyping(
      { conversationId: data.conversationId, isTyping: false },
      socket,
    );

    socket.to(data.conversationId).emit('user_left_conversation', {
      userId: socket.userId,
      conversationId: data.conversationId,
    });

    this.logger.log(
      `User ${socket.userId} left conversation ${data.conversationId}`,
    );
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    try {
      // Send message through service
      const message = await this.messagesService.sendMessage(
        socket.userId!,
        data,
      );

      // Convert to DTO
      const messageDto = await this.messagesService.formatMessageToDto(message);

      // Emit to conversation room
      this.server.to(data.conversationId).emit('new_message', messageDto);

      // Update conversation's last message
      this.server.to(data.conversationId).emit('conversation_updated', {
        conversationId: data.conversationId,
        lastMessage: {
          content: message.content,
          type: message.type,
          senderId: message.senderId,
          createdAt: message.createdAt,
        },
      });

      // Stop typing indicator for sender
      this.handleStopTyping(
        { conversationId: data.conversationId, isTyping: false },
        socket,
      );

      this.logger.log(`Message sent in conversation ${data.conversationId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('typing_indicator')
  async handleTypingIndicator(
    @MessageBody() data: TypingIndicatorDto,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.handleTypingStatus(data, socket);
  }

  @SubscribeMessage('start_typing')
  async handleStartTyping(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.handleTypingStatus({ ...data, isTyping: true }, socket);
  }

  @SubscribeMessage('stop_typing')
  async handleStopTyping(
    @MessageBody() data: TypingIndicatorDto,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.handleTypingStatus({ ...data, isTyping: false }, socket);
  }

  @SubscribeMessage('mark_messages_read')
  async handleMarkMessagesRead(
    @MessageBody() data: { conversationId: string; messageIds: string[] },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    try {
      await this.messagesService.markMessagesAsRead(
        data.messageIds,
        socket.userId!,
      );

      // Notify other participants
      socket.to(data.conversationId).emit('messages_read', {
        messageIds: data.messageIds,
        readBy: socket.userId,
        readAt: new Date(),
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('send_message_request')
  async handleSendMessageRequest(
    @MessageBody() data: CreateMessageRequestDto,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    try {
      if (socket.userRole !== 'trainee') {
        throw new WsException('Only trainees can send message requests');
      }

      const request = await this.messageRequestService.createMessageRequest(
        socket.userId!,
        data,
      );
      const requestDto =
        await this.messageRequestService.formatRequestToDto(request);

      // Notify the coach about new message request
      this.notifyUser(data.coachId, 'new_message_request', requestDto);

      // Confirm to trainee
      socket.emit('message_request_sent', requestDto);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('respond_to_message_request')
  async handleRespondToMessageRequest(
    @MessageBody()
    data: { requestId: string; response: RespondToMessageRequestDto },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    try {
      if (socket.userRole !== 'coach') {
        throw new WsException('Only coaches can respond to message requests');
      }

      const request = await this.messageRequestService.respondToMessageRequest(
        data.requestId,
        socket.userId!,
        data.response,
      );

      const requestDto =
        await this.messageRequestService.formatRequestToDto(request);

      // Notify trainee about response
      this.notifyUser(
        request.traineeId,
        'message_request_response',
        requestDto,
      );

      // If accepted, create conversation and notify both parties
      if (data.response.action === 'accept') {
        const conversation = await this.messagesService.createConversation(
          request.traineeId,
          request.coachId,
        );

        const conversationDto =
          await this.messagesService.formatConversationToDto(
            conversation,
            request.traineeId,
          );

        // Notify both users about new conversation
        this.notifyUser(
          request.traineeId,
          'conversation_created',
          conversationDto,
        );
        this.notifyUser(
          request.coachId,
          'conversation_created',
          conversationDto,
        );
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // Helper methods
  private handleTypingStatus(
    data: TypingIndicatorDto,
    socket: AuthenticatedSocket,
  ) {
    const conversationId = data.conversationId;
    const userId = socket.userId!;

    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }

    const typingUsersInConversation = this.typingUsers.get(conversationId)!;

    if (data.isTyping) {
      typingUsersInConversation.add(userId);
    } else {
      typingUsersInConversation.delete(userId);
    }

    this.notifyTypingStatusChange(conversationId, userId, data.isTyping);
  }

  private notifyTypingStatusChange(
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ) {
    this.server.to(conversationId).emit('typing_status_changed', {
      conversationId,
      userId,
      isTyping,
      typingUsers: Array.from(this.typingUsers.get(conversationId) || []),
    });
  }

  private notifyUser(userId: string, event: string, data: any) {
    const userSocketIds = this.connectedUsers.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        const socket = this.userSockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      });
    }
  }

  private async notifyUserStatusChange(userId: string, isOnline: boolean) {
    // Get user's conversations and notify participants
    const conversations = await this.messagesService.getUserConversations(
      userId,
      { page: 1, limit: 1000 },
    );

    conversations.conversations.forEach((conversation) => {
      const otherUserId =
        conversation.trainee.id === userId
          ? conversation.coach.id
          : conversation.trainee.id;
      this.notifyUser(otherUserId, 'user_status_changed', {
        userId,
        isOnline,
        lastSeen: isOnline ? null : new Date(),
      });
    });
  }

  private async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    // This would typically update a user's online status in the database
    // For now, we'll just track it in memory
    this.logger.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
  }

  // Method to get online users for a conversation
  public getOnlineUsersInConversation(conversationId: string): string[] {
    const room = this.server.sockets.adapter.rooms.get(conversationId);
    if (!room) return [];

    const onlineUsers: string[] = [];
    room.forEach((socketId) => {
      const socket = this.userSockets.get(socketId);
      if (socket?.userId) {
        onlineUsers.push(socket.userId);
      }
    });

    return onlineUsers;
  }

  // Method to check if user is online
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
