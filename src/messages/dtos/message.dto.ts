import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ConversationStatus } from '../entities/conversation.entity';
import { MessageRequestStatus } from '../entities/message-request.entity';
import { MessageStatus, MessageType } from '../entities/message.entity';

// Message DTOs
export class SendMessageDto {
  @ApiProperty({ description: 'Conversation ID where message is sent' })
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description: 'Message type',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({
    description: 'Message metadata for files, images, etc.',
  })
  @IsOptional()
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    thumbnailUrl?: string;
    duration?: number;
    dimensions?: { width: number; height: number };
  };
}

export class MessageDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Conversation ID' })
  conversationId: string;

  @ApiProperty({ description: 'Sender information' })
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };

  @ApiProperty({ description: 'Receiver information' })
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };

  @ApiProperty({ description: 'Message content' })
  content: string;

  @ApiProperty({ description: 'Message type', enum: MessageType })
  type: MessageType;

  @ApiProperty({ description: 'Message status', enum: MessageStatus })
  status: MessageStatus;

  @ApiProperty({ description: 'Message metadata' })
  metadata?: any;

  @ApiProperty({ description: 'Whether message is archived' })
  isArchived: boolean;

  @ApiProperty({ description: 'When message was read' })
  readAt?: Date;

  @ApiProperty({ description: 'When message was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When message was updated' })
  updatedAt: Date;
}

export class MessageListDto {
  @ApiProperty({ type: [MessageDto] })
  messages: MessageDto[];

  @ApiProperty({ description: 'Total number of messages' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevious: boolean;
}

export class MarkAsReadDto {
  @ApiProperty({ description: 'Array of message IDs to mark as read' })
  @IsArray()
  @IsUUID(4, { each: true })
  messageIds: string[];
}

// Conversation DTOs
export class ConversationDto {
  @ApiProperty({ description: 'Conversation ID' })
  id: string;

  @ApiProperty({ description: 'Trainee information' })
  trainee: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };

  @ApiProperty({ description: 'Coach information' })
  coach: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };

  @ApiProperty({ description: 'Conversation status', enum: ConversationStatus })
  status: ConversationStatus;

  @ApiProperty({ description: 'Last message preview' })
  lastMessage?: {
    content: string;
    type: MessageType;
    senderId: string;
    createdAt: Date;
  };

  @ApiProperty({ description: 'Unread message count for current user' })
  unreadCount: number;

  @ApiProperty({
    description: 'Whether conversation is archived by current user',
  })
  isArchived: boolean;

  @ApiProperty({ description: 'When conversation was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When last message was sent' })
  lastMessageAt?: Date;
}

export class ConversationListDto {
  @ApiProperty({ type: [ConversationDto] })
  conversations: ConversationDto[];

  @ApiProperty({ description: 'Total number of conversations' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}

export class UpdateConversationDto {
  @ApiPropertyOptional({
    description: 'Update conversation status',
    enum: ConversationStatus,
  })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({ description: 'Archive/unarchive conversation' })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

// Message Request DTOs
export class CreateMessageRequestDto {
  @ApiProperty({ description: 'Coach ID to send request to' })
  @IsUUID()
  @IsNotEmpty()
  coachId: string;

  @ApiProperty({ description: 'Initial message to the coach' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  initialMessage: string;

  @ApiPropertyOptional({ description: 'Reason for wanting to connect' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;

  @ApiPropertyOptional({ description: 'Request metadata' })
  @IsOptional()
  metadata?: {
    urgency?: 'low' | 'medium' | 'high';
    preferredTime?: string;
  };
}

export class MessageRequestDto {
  @ApiProperty({ description: 'Request ID' })
  id: string;

  @ApiProperty({ description: 'Trainee information' })
  trainee: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    age?: number;
    goal?: string;
    experience?: string;
  };

  @ApiProperty({ description: 'Coach information' })
  coach: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };

  @ApiProperty({ description: 'Initial message from trainee' })
  initialMessage: string;

  @ApiProperty({ description: 'Reason for wanting to connect' })
  reason?: string;

  @ApiProperty({ description: 'Request status', enum: MessageRequestStatus })
  status: MessageRequestStatus;

  @ApiProperty({ description: 'Coach response message' })
  responseMessage?: string;

  @ApiProperty({ description: 'Request metadata' })
  metadata?: any;

  @ApiProperty({ description: 'When request was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When coach responded' })
  respondedAt?: Date;

  @ApiProperty({ description: 'Request expiration date' })
  expiresAt?: Date;
}

export class MessageRequestListDto {
  @ApiProperty({ type: [MessageRequestDto] })
  requests: MessageRequestDto[];

  @ApiProperty({ description: 'Total number of requests' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}

export class RespondToMessageRequestDto {
  @ApiProperty({ description: 'Response action', enum: ['accept', 'reject'] })
  @IsEnum(['accept', 'reject'])
  action: 'accept' | 'reject';

  @ApiPropertyOptional({ description: 'Optional response message' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  responseMessage?: string;
}

// Filter and pagination DTOs
export class MessageFilterDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search in message content' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by message type',
    enum: MessageType,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ description: 'Show only unread messages' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  unreadOnly?: boolean;
}

export class ConversationFilterDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by conversation status',
    enum: ConversationStatus,
  })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({ description: 'Show only archived conversations' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  archivedOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Show only conversations with unread messages',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  unreadOnly?: boolean;
}

export class MessageRequestFilterDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by request status',
    enum: MessageRequestStatus,
  })
  @IsOptional()
  @IsEnum(MessageRequestStatus)
  status?: MessageRequestStatus;
}

// WebSocket DTOs
export class JoinRoomDto {
  @ApiProperty({ description: 'Conversation ID to join' })
  @IsUUID()
  conversationId: string;
}

export class TypingIndicatorDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsUUID()
  conversationId: string;

  @ApiProperty({ description: 'Whether user is typing' })
  @IsBoolean()
  isTyping: boolean;
}
