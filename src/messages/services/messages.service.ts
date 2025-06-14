import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  MessageEntity,
  MessageStatus,
  MessageType,
} from '../entities/message.entity';
import {
  ConversationEntity,
  ConversationStatus,
} from '../entities/conversation.entity';
import { UserEntity } from '../../auth/entities/user.entity';
import {
  SendMessageDto,
  MessageDto,
  MessageListDto,
  ConversationDto,
  ConversationListDto,
  MessageFilterDto,
  ConversationFilterDto,
  UpdateConversationDto,
} from '../dtos/message.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,

    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    senderId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<MessageEntity> {
    // Verify conversation exists and user has access
    const conversation = await this.conversationRepository.findOne({
      where: { id: sendMessageDto.conversationId },
      relations: ['trainee', 'coach'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is part of the conversation
    if (
      conversation.traineeId !== senderId &&
      conversation.coachId !== senderId
    ) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    // Check if conversation is active
    if (conversation.status !== ConversationStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot send message to inactive conversation',
      );
    }

    // Determine receiver
    const receiverId =
      conversation.traineeId === senderId
        ? conversation.coachId
        : conversation.traineeId;

    // Create message
    const message = this.messageRepository.create({
      conversationId: sendMessageDto.conversationId,
      senderId,
      receiverId,
      content: sendMessageDto.content,
      type: sendMessageDto.type || MessageType.TEXT,
      metadata: sendMessageDto.metadata,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation's last message info
    await this.updateConversationLastMessage(conversation, savedMessage);

    // Update unread counts
    await this.incrementUnreadCount(conversation, receiverId);

    return savedMessage;
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    filters: MessageFilterDto,
  ): Promise<MessageListDto> {
    // Verify user has access to conversation
    await this.verifyConversationAccess(conversationId, userId);

    const queryBuilder = this.createMessageQueryBuilder(conversationId);

    // Apply filters
    this.applyMessageFilters(queryBuilder, filters);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (filters.page! - 1) * filters.limit!;
    queryBuilder.skip(offset).take(filters.limit!);

    // Order by creation date (newest first)
    queryBuilder.orderBy('message.createdAt', 'DESC');

    const messages = await queryBuilder.getMany();

    // Format messages to DTOs
    const messageDtos = await Promise.all(
      messages.map((message) => this.formatMessageToDto(message)),
    );

    const totalPages = Math.ceil(total / filters.limit!);

    return {
      messages: messageDtos,
      total,
      page: filters.page!,
      limit: filters.limit!,
      totalPages,
      hasNext: filters.page! < totalPages,
      hasPrevious: filters.page! > 1,
    };
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(
    userId: string,
    filters: ConversationFilterDto,
  ): Promise<ConversationListDto> {
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.trainee', 'trainee')
      .leftJoinAndSelect('conversation.coach', 'coach')
      .where(
        'conversation.traineeId = :userId OR conversation.coachId = :userId',
        { userId },
      );

    // Apply filters
    this.applyConversationFilters(queryBuilder, filters, userId);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (filters.page! - 1) * filters.limit!;
    queryBuilder.skip(offset).take(filters.limit!);

    // Order by last message date
    queryBuilder.orderBy('conversation.lastMessageAt', 'DESC');

    const conversations = await queryBuilder.getMany();

    // Format conversations to DTOs
    const conversationDtos = await Promise.all(
      conversations.map((conversation) =>
        this.formatConversationToDto(conversation, userId),
      ),
    );

    return {
      conversations: conversationDtos,
      total,
      page: filters.page!,
      limit: filters.limit!,
    };
  }

  /**
   * Create a new conversation between trainee and coach
   */
  async createConversation(
    traineeId: string,
    coachId: string,
  ): Promise<ConversationEntity> {
    // Check if conversation already exists
    const existingConversation = await this.conversationRepository.findOne({
      where: { traineeId, coachId },
    });

    if (existingConversation) {
      // Reactivate if it was archived or blocked
      if (existingConversation.status !== ConversationStatus.ACTIVE) {
        existingConversation.status = ConversationStatus.ACTIVE;
        return await this.conversationRepository.save(existingConversation);
      }
      return existingConversation;
    }

    // Create new conversation
    const conversation = this.conversationRepository.create({
      traineeId,
      coachId,
      status: ConversationStatus.ACTIVE,
      traineeUnreadCount: 0,
      coachUnreadCount: 0,
      traineeArchived: false,
      coachArchived: false,
    });

    return await this.conversationRepository.save(conversation);
  }

  /**
   * Update conversation settings
   */
  async updateConversation(
    conversationId: string,
    userId: string,
    updateDto: UpdateConversationDto,
  ): Promise<ConversationEntity> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user has access
    if (conversation.traineeId !== userId && conversation.coachId !== userId) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    // Update fields
    if (updateDto.status !== undefined) {
      conversation.status = updateDto.status;
    }

    if (updateDto.archived !== undefined) {
      if (conversation.traineeId === userId) {
        conversation.traineeArchived = updateDto.archived;
      } else {
        conversation.coachArchived = updateDto.archived;
      }
    }

    return await this.conversationRepository.save(conversation);
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    messageIds: string[],
    userId: string,
  ): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .update(MessageEntity)
      .set({
        status: MessageStatus.READ,
        readAt: new Date(),
      })
      .where('id IN (:...messageIds)', { messageIds })
      .andWhere('receiverId = :userId', { userId })
      .andWhere('status != :readStatus', { readStatus: MessageStatus.READ })
      .execute();
  }

  /**
   * Mark entire conversation as read
   */
  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // Mark all unread messages as read
    await this.messageRepository
      .createQueryBuilder()
      .update(MessageEntity)
      .set({
        status: MessageStatus.READ,
        readAt: new Date(),
      })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('receiverId = :userId', { userId })
      .andWhere('status != :readStatus', { readStatus: MessageStatus.READ })
      .execute();

    // Reset unread count
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (conversation) {
      if (conversation.traineeId === userId) {
        conversation.traineeUnreadCount = 0;
      } else if (conversation.coachId === userId) {
        conversation.coachUnreadCount = 0;
      }

      await this.conversationRepository.save(conversation);
    }
  }

  /**
   * Verify user has access to conversation
   */
  async verifyConversationAccess(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const hasAccess =
      conversation.traineeId === userId || conversation.coachId === userId;

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    return true;
  }

  /**
   * Get conversation statistics for a user
   */
  async getConversationStats(userId: string): Promise<{
    totalConversations: number;
    unreadConversations: number;
    totalUnreadMessages: number;
    activeConversations: number;
  }> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(
        'conversation.traineeId = :userId OR conversation.coachId = :userId',
        { userId },
      )
      .getMany();

    const totalConversations = conversations.length;
    const activeConversations = conversations.filter(
      (c) => c.status === ConversationStatus.ACTIVE,
    ).length;

    let totalUnreadMessages = 0;
    let unreadConversations = 0;

    conversations.forEach((conversation) => {
      const unreadCount =
        conversation.traineeId === userId
          ? conversation.traineeUnreadCount
          : conversation.coachUnreadCount;

      totalUnreadMessages += unreadCount;
      if (unreadCount > 0) {
        unreadConversations++;
      }
    });

    return {
      totalConversations,
      unreadConversations,
      totalUnreadMessages,
      activeConversations,
    };
  }

  /**
   * Format message entity to DTO
   */
  async formatMessageToDto(message: MessageEntity): Promise<MessageDto> {
    // Load sender and receiver if not already loaded
    if (!message.sender) {
      message.sender = await this.userRepository.findOne({
        where: { id: message.senderId },
      });
    }
    if (!message.receiver) {
      message.receiver = await this.userRepository.findOne({
        where: { id: message.receiverId },
      });
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      sender: {
        id: message.sender.id,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        profilePictureUrl: (message.sender as any).profilePictureUrl,
      },
      receiver: {
        id: message.receiver.id,
        firstName: message.receiver.firstName,
        lastName: message.receiver.lastName,
        profilePictureUrl: (message.receiver as any).profilePictureUrl,
      },
      content: message.content,
      type: message.type,
      status: message.status,
      metadata: message.metadata,
      isArchived: message.isArchived,
      readAt: message.readAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  /**
   * Format conversation entity to DTO
   */
  async formatConversationToDto(
    conversation: ConversationEntity,
    currentUserId: string,
  ): Promise<ConversationDto> {
    // Get last message
    const lastMessage = await this.messageRepository.findOne({
      where: { conversationId: conversation.id },
      order: { createdAt: 'DESC' },
    });

    const unreadCount =
      conversation.traineeId === currentUserId
        ? conversation.traineeUnreadCount
        : conversation.coachUnreadCount;

    const isArchived =
      conversation.traineeId === currentUserId
        ? conversation.traineeArchived
        : conversation.coachArchived;

    return {
      id: conversation.id,
      trainee: {
        id: conversation.trainee.id,
        firstName: conversation.trainee.firstName,
        lastName: conversation.trainee.lastName,
        profilePictureUrl: (conversation.trainee as any).profilePictureUrl,
        // These would come from online status tracking
        isOnline: false,
        lastSeen: undefined,
      },
      coach: {
        id: conversation.coach.id,
        firstName: conversation.coach.firstName,
        lastName: conversation.coach.lastName,
        profilePictureUrl: (conversation.coach as any).profilePictureUrl,
        isOnline: false,
        lastSeen: undefined,
      },
      status: conversation.status,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            type: lastMessage.type,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          }
        : undefined,
      unreadCount,
      isArchived,
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt,
    };
  }

  // Private helper methods
  private createMessageQueryBuilder(
    conversationId: string,
  ): SelectQueryBuilder<MessageEntity> {
    return this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('message.conversationId = :conversationId', { conversationId });
  }

  private applyMessageFilters(
    queryBuilder: SelectQueryBuilder<MessageEntity>,
    filters: MessageFilterDto,
  ): void {
    if (filters.search) {
      queryBuilder.andWhere('message.content ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('message.type = :type', { type: filters.type });
    }

    if (filters.unreadOnly) {
      queryBuilder.andWhere('message.status != :readStatus', {
        readStatus: MessageStatus.READ,
      });
    }
  }

  private applyConversationFilters(
    queryBuilder: SelectQueryBuilder<ConversationEntity>,
    filters: ConversationFilterDto,
    userId: string,
  ): void {
    if (filters.status) {
      queryBuilder.andWhere('conversation.status = :status', {
        status: filters.status,
      });
    }

    if (filters.archivedOnly !== undefined) {
      const archivedField = `conversation.${userId === 'traineeId' ? 'trainee' : 'coach'}Archived`;
      queryBuilder.andWhere(`${archivedField} = :archived`, {
        archived: filters.archivedOnly,
      });
    }

    if (filters.unreadOnly) {
      const unreadField = `conversation.${userId === 'traineeId' ? 'trainee' : 'coach'}UnreadCount`;
      queryBuilder.andWhere(`${unreadField} > 0`);
    }
  }

  private async updateConversationLastMessage(
    conversation: ConversationEntity,
    message: MessageEntity,
  ): Promise<void> {
    conversation.lastMessageContent = message.content.substring(0, 100);
    conversation.lastMessageAt = message.createdAt;
    await this.conversationRepository.save(conversation);
  }

  private async incrementUnreadCount(
    conversation: ConversationEntity,
    receiverId: string,
  ): Promise<void> {
    if (conversation.traineeId === receiverId) {
      conversation.traineeUnreadCount++;
    } else if (conversation.coachId === receiverId) {
      conversation.coachUnreadCount++;
    }

    await this.conversationRepository.save(conversation);
  }
}
