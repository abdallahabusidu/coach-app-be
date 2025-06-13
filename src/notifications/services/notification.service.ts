import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import {
  NotificationEntity,
  NotificationStatus,
} from '../entities/notification.entity';
import { CreateNotificationDto } from '../dtos/create-notification.dto';
import {
  NotificationQueryDto,
  UpdateNotificationStatusDto,
  BulkUpdateNotificationsDto,
} from '../dtos/notification-query.dto';

export interface NotificationListResponse {
  notifications: NotificationEntity[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface NotificationStats {
  unreadCount: number;
  totalCount: number;
  byType: Record<string, number>;
  recentCount: number; // notifications from last 24 hours
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationEntity> {
    const notification = this.notificationRepository.create({
      type: dto.type,
      header: dto.header,
      description: dto.description,
      userId: dto.userId,
      navigationLink: dto.navigationLink,
      metadata: dto.metadata || {},
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * Create multiple notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    dto: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<NotificationEntity[]> {
    if (!userIds.length) {
      throw new BadRequestException('At least one user ID is required');
    }

    const notifications = userIds.map((userId) =>
      this.notificationRepository.create({
        type: dto.type,
        header: dto.header,
        description: dto.description,
        userId,
        navigationLink: dto.navigationLink,
        metadata: dto.metadata || {},
      }),
    );

    return await this.notificationRepository.save(notifications);
  }

  /**
   * Get notifications with filtering, sorting, and pagination
   */
  async getNotifications(
    query: NotificationQueryDto,
    currentUserId: string,
    isAdmin: boolean = false,
  ): Promise<NotificationListResponse> {
    const queryBuilder = this.createQueryBuilder();

    // Apply user filter - admins can see all notifications if userId specified
    if (query.userId && isAdmin) {
      queryBuilder.andWhere('notification.userId = :userId', {
        userId: query.userId,
      });
    } else {
      queryBuilder.andWhere('notification.userId = :userId', {
        userId: currentUserId,
      });
    }

    // Apply type filter
    if (query.type && query.type.length > 0) {
      queryBuilder.andWhere('notification.type IN (:...types)', {
        types: query.type,
      });
    }

    // Apply status filter
    if (query.status) {
      queryBuilder.andWhere('notification.status = :status', {
        status: query.status,
      });
    }

    // Apply sorting
    queryBuilder.orderBy('notification.timestamp', query.sortOrder || 'DESC');

    // Apply pagination
    const skip = ((query.page || 1) - 1) * (query.limit || 20);
    queryBuilder.skip(skip).take(query.limit || 20);

    // Get results and total count
    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      notifications,
      total,
      page: query.page || 1,
      limit: query.limit || 20,
      hasNext: skip + notifications.length < total,
      hasPrevious: (query.page || 1) > 1,
    };
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(
    id: string,
    currentUserId: string,
    isAdmin: boolean = false,
  ): Promise<NotificationEntity> {
    const queryBuilder = this.createQueryBuilder().where(
      'notification.id = :id',
      { id },
    );

    if (!isAdmin) {
      queryBuilder.andWhere('notification.userId = :userId', {
        userId: currentUserId,
      });
    }

    const notification = await queryBuilder.getOne();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(
    id: string,
    dto: UpdateNotificationStatusDto,
    currentUserId: string,
    isAdmin: boolean = false,
  ): Promise<NotificationEntity> {
    const notification = await this.getNotificationById(
      id,
      currentUserId,
      isAdmin,
    );

    // Update status and readAt timestamp
    notification.status = dto.status;
    if (dto.status === NotificationStatus.READ && !notification.readAt) {
      notification.readAt = new Date();
    } else if (dto.status === NotificationStatus.UNREAD) {
      notification.readAt = null;
    }

    return await this.notificationRepository.save(notification);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    id: string,
    currentUserId: string,
    isAdmin: boolean = false,
  ): Promise<NotificationEntity> {
    return this.updateNotificationStatus(
      id,
      { status: NotificationStatus.READ },
      currentUserId,
      isAdmin,
    );
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(
    id: string,
    currentUserId: string,
    isAdmin: boolean = false,
  ): Promise<NotificationEntity> {
    return this.updateNotificationStatus(
      id,
      { status: NotificationStatus.UNREAD },
      currentUserId,
      isAdmin,
    );
  }

  /**
   * Bulk update notification statuses
   */
  async bulkUpdateNotifications(
    dto: BulkUpdateNotificationsDto,
    currentUserId: string,
    isAdmin: boolean = false,
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    // Build base query for validation
    const queryBuilder = this.notificationRepository
      .createQueryBuilder()
      .where('id IN (:...ids)', { ids: dto.notificationIds });

    if (!isAdmin) {
      queryBuilder.andWhere('userId = :userId', { userId: currentUserId });
    }

    const existingNotifications = await queryBuilder.getMany();
    const existingIds = existingNotifications.map((n) => n.id);

    // Find failed IDs (notifications that don't exist or user doesn't have access to)
    dto.notificationIds.forEach((id) => {
      if (!existingIds.includes(id)) {
        failed.push(id);
      }
    });

    // Update existing notifications
    if (existingIds.length > 0) {
      const updateData: any = { status: dto.status };

      if (dto.status === NotificationStatus.READ) {
        updateData.readAt = new Date();
      } else if (dto.status === NotificationStatus.UNREAD) {
        updateData.readAt = null;
      }

      const result = await this.notificationRepository.update(
        { id: In(existingIds) },
        updateData,
      );

      updated = result.affected || 0;
    }

    return { updated, failed };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(currentUserId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update(
      {
        userId: currentUserId,
        status: NotificationStatus.UNREAD,
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );

    return { updated: result.affected || 0 };
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    id: string,
    currentUserId: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    const notification = await this.getNotificationById(
      id,
      currentUserId,
      isAdmin,
    );
    await this.notificationRepository.remove(notification);
  }

  /**
   * Delete multiple notifications
   */
  async bulkDeleteNotifications(
    notificationIds: string[],
    currentUserId: string,
    isAdmin: boolean = false,
  ): Promise<{ deleted: number; failed: string[] }> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder()
      .where('id IN (:...ids)', { ids: notificationIds });

    if (!isAdmin) {
      queryBuilder.andWhere('userId = :userId', { userId: currentUserId });
    }

    const notifications = await queryBuilder.getMany();
    const existingIds = notifications.map((n) => n.id);
    const failed = notificationIds.filter((id) => !existingIds.includes(id));

    if (notifications.length > 0) {
      await this.notificationRepository.remove(notifications);
    }

    return {
      deleted: notifications.length,
      failed,
    };
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(
    currentUserId: string,
    isAdmin: boolean = false,
    targetUserId?: string,
  ): Promise<NotificationStats> {
    const userId = isAdmin && targetUserId ? targetUserId : currentUserId;

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });

    // Get total count
    const totalCount = await this.notificationRepository.count({
      where: { userId },
    });

    // Get count by type
    const typeStats = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type, COUNT(*) as count')
      .where('notification.userId = :userId', { userId })
      .groupBy('notification.type')
      .getRawMany();

    const byType: Record<string, number> = {};
    typeStats.forEach((stat) => {
      byType[stat.notification_type] = parseInt(stat.count);
    });

    // Get recent count (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentCount = await this.notificationRepository.count({
      where: {
        userId,
        timestamp: {
          // @ts-ignore - TypeORM MoreThan not imported but works
          $gte: yesterday,
        } as any,
      },
    });

    return {
      unreadCount,
      totalCount,
      byType,
      recentCount,
    };
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOldNotifications(
    daysToKeep: number = 30,
  ): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    return { deleted: result.affected || 0 };
  }

  /**
   * Create a query builder with user relation
   */
  private createQueryBuilder(): SelectQueryBuilder<NotificationEntity> {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user');
  }
}
