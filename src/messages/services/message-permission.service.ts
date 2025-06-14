import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SubscriptionRequestService } from '../../subscribed-trainees/services/subscription-request.service';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';

@Injectable()
export class MessagePermissionService {
  private readonly logger = new Logger(MessagePermissionService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly subscriptionRequestService: SubscriptionRequestService,
  ) {}

  /**
   * Check if users can message each other based on subscription status
   */
  async checkMessagePermission(
    senderId: string,
    receiverId: string,
    senderRole: UserRole,
    receiverRole: UserRole,
  ): Promise<{
    canMessage: boolean;
    reason?: string;
    requestId?: string;
  }> {
    // Admin can message anyone
    if (senderRole === UserRole.ADMIN) {
      return { canMessage: true };
    }

    // Same role users cannot message each other (coach-to-coach, trainee-to-trainee)
    if (senderRole === receiverRole) {
      return {
        canMessage: false,
        reason: 'Users of the same role cannot message each other',
      };
    }

    // Check subscription-based permissions
    if (senderRole === UserRole.TRAINEE && receiverRole === UserRole.COACH) {
      // Trainee messaging coach
      const canMessage =
        await this.subscriptionRequestService.canTraineeMessageCoach(
          senderId,
          receiverId,
        );

      if (!canMessage) {
        return {
          canMessage: false,
          reason:
            'You need to send a subscription request to this coach before messaging',
        };
      }

      // Update message count for the subscription request
      await this.subscriptionRequestService.incrementMessageCount(
        senderId,
        receiverId,
      );

      return { canMessage: true };
    }

    if (senderRole === UserRole.COACH && receiverRole === UserRole.TRAINEE) {
      // Coach messaging trainee
      const canViewProfile =
        await this.subscriptionRequestService.canCoachViewTraineeProfile(
          senderId,
          receiverId,
        );

      if (!canViewProfile) {
        return {
          canMessage: false,
          reason:
            'You can only message trainees who have sent you subscription requests',
        };
      }

      // Update message count for the subscription request
      await this.subscriptionRequestService.incrementMessageCount(
        receiverId,
        senderId,
      );

      return { canMessage: true };
    }

    return {
      canMessage: false,
      reason: 'Invalid user role combination',
    };
  }

  /**
   * Validate message before sending
   */
  async validateMessagePermission(
    senderId: string,
    receiverId: string,
  ): Promise<void> {
    // Get sender and receiver details
    const [sender, receiver] = await Promise.all([
      this.userRepository.findOne({ where: { id: senderId } }),
      this.userRepository.findOne({ where: { id: receiverId } }),
    ]);

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    if (!receiver.isActive) {
      throw new ForbiddenException('Cannot send message to inactive user');
    }

    // Check message permissions
    const permission = await this.checkMessagePermission(
      senderId,
      receiverId,
      sender.role,
      receiver.role,
    );

    if (!permission.canMessage) {
      throw new ForbiddenException(
        permission.reason || 'You are not allowed to message this user',
      );
    }
  }

  /**
   * Get message permissions for a user's conversation list
   */
  async getConversationPermissions(
    userId: string,
    userRole: UserRole,
  ): Promise<{
    canMessageCoaches: boolean;
    canMessageTrainees: boolean;
    activeCoaches: string[];
    activeTrainees: string[];
  }> {
    if (userRole === UserRole.ADMIN) {
      return {
        canMessageCoaches: true,
        canMessageTrainees: true,
        activeCoaches: [],
        activeTrainees: [],
      };
    }

    if (userRole === UserRole.TRAINEE) {
      const activeCoaches =
        await this.subscriptionRequestService.getTraineeActiveCoaches(userId);
      return {
        canMessageCoaches: activeCoaches.length > 0,
        canMessageTrainees: false,
        activeCoaches: activeCoaches.map((req) => req.coach.id),
        activeTrainees: [],
      };
    }

    if (userRole === UserRole.COACH) {
      const activeTrainees =
        await this.subscriptionRequestService.getCoachActiveTrainees(userId);
      return {
        canMessageCoaches: false,
        canMessageTrainees: activeTrainees.length > 0,
        activeCoaches: [],
        activeTrainees: activeTrainees.map((req) => req.trainee.id),
      };
    }

    return {
      canMessageCoaches: false,
      canMessageTrainees: false,
      activeCoaches: [],
      activeTrainees: [],
    };
  }

  /**
   * Get list of users the current user can message
   */
  async getMessageableUsers(
    userId: string,
    userRole: UserRole,
  ): Promise<
    {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      profilePicture?: string;
      isOnline?: boolean;
      lastActive?: Date;
      unreadCount?: number;
    }[]
  > {
    const permissions = await this.getConversationPermissions(userId, userRole);
    const messageableUserIds = [
      ...permissions.activeCoaches,
      ...permissions.activeTrainees,
    ];

    if (messageableUserIds.length === 0) {
      return [];
    }

    const users = await this.userRepository.find({
      where: { id: In(messageableUserIds), isActive: true },
      select: ['id', 'firstName', 'lastName', 'email', 'role'],
    });

    return users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      profilePicture: undefined, // Would be fetched from profile
      isOnline: false, // Would be determined from real-time status
      lastActive: new Date(), // Would be fetched from last activity
      unreadCount: 0, // Would be calculated from message status
    }));
  }

  /**
   * Check if user can start a new conversation with another user
   */
  async canStartConversation(
    senderId: string,
    receiverId: string,
  ): Promise<{
    canStart: boolean;
    reason?: string;
    suggestedAction?: string;
  }> {
    const [sender, receiver] = await Promise.all([
      this.userRepository.findOne({ where: { id: senderId } }),
      this.userRepository.findOne({ where: { id: receiverId } }),
    ]);

    if (!sender || !receiver) {
      return {
        canStart: false,
        reason: 'User not found',
      };
    }

    const permission = await this.checkMessagePermission(
      senderId,
      receiverId,
      sender.role,
      receiver.role,
    );

    if (!permission.canMessage) {
      let suggestedAction: string | undefined;

      if (
        sender.role === UserRole.TRAINEE &&
        receiver.role === UserRole.COACH
      ) {
        suggestedAction = 'Send a subscription request to this coach first';
      } else if (
        sender.role === UserRole.COACH &&
        receiver.role === UserRole.TRAINEE
      ) {
        suggestedAction =
          'Wait for this trainee to send you a subscription request';
      }

      return {
        canStart: false,
        reason: permission.reason,
        suggestedAction,
      };
    }

    return { canStart: true };
  }
}
