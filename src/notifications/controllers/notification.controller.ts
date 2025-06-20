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
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  Req,
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
import { UserRole } from '../../auth/entities/user.entity';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dtos/create-notification.dto';
import {
  NotificationQueryDto,
  UpdateNotificationStatusDto,
  BulkUpdateNotificationsDto,
} from '../dtos/notification-query.dto';
import { NotificationEntity } from '../entities/notification.entity';
import {
  ApiCreateResponses,
  ApiCrudResponses,
  ApiUpdateResponses,
  ApiDeleteResponses,
  ApiPaginatedResponse,
  ApiAuthResponses,
} from '../../common/decorators/api-responses.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COACH)
  @ApiOperation({
    summary: 'Create a new notification',
    description:
      'Create a new notification for a specific user. Only admins and coaches can create notifications.',
  })
  @ApiCreateResponses('Notification', NotificationEntity)
  @ApiAuthResponses()
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationEntity> {
    return this.notificationService.createNotification(createNotificationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get notifications with filtering and pagination',
    description:
      'Retrieve notifications for the current user with optional filtering by type, status, and pagination.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    isArray: true,
    description: 'Filter by notification types',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by notification status',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        notifications: {
          type: 'array',
          items: { $ref: '#/components/schemas/NotificationEntity' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        hasNext: { type: 'boolean' },
        hasPrevious: { type: 'boolean' },
      },
    },
  })
  async getNotifications(
    @Query() query: NotificationQueryDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const isAdmin = user.role === UserRole.ADMIN;

    return this.notificationService.getNotifications(query, user.id, isAdmin);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get notification statistics',
    description:
      'Get notification statistics including unread count, total count, and count by type.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        unreadCount: { type: 'number' },
        totalCount: { type: 'number' },
        byType: { type: 'object' },
        recentCount: { type: 'number' },
      },
    },
  })
  async getNotificationStats(@Req() req: Request) {
    const user = (req as any).user;
    const isAdmin = user.role === UserRole.ADMIN;

    return this.notificationService.getNotificationStats(user.id, isAdmin);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Get the count of unread notifications for the current user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        unreadCount: { type: 'number' },
      },
    },
  })
  async getUnreadCount(@Req() req: Request) {
    const user = (req as any).user;
    const unreadCount = await this.notificationService.getUnreadCount(user.id);
    return { unreadCount };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieve a specific notification by its ID.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification retrieved successfully',
    type: NotificationEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async getNotificationById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<NotificationEntity> {
    const user = (req as any).user;
    const isAdmin = user.role === UserRole.ADMIN;

    return this.notificationService.getNotificationById(id, user.id, isAdmin);
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Update notification status',
    description: 'Update the status (read/unread) of a specific notification.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification status updated successfully',
    type: NotificationEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async updateNotificationStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateNotificationStatusDto,
    @Req() req: Request,
  ): Promise<NotificationEntity> {
    const user = (req as any).user;
    const isAdmin = user.role === UserRole.ADMIN;

    return this.notificationService.updateNotificationStatus(
      id,
      updateStatusDto,
      user.id,
      isAdmin,
    );
  }

  @Put(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read',
    type: NotificationEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<NotificationEntity> {
    const user = (req as any).user;
    const isAdmin = user.role === UserRole.ADMIN;

    return this.notificationService.markAsRead(id, user.id, isAdmin);
  }

  @Put(':id/unread')
  @ApiOperation({
    summary: 'Mark notification as unread',
    description: 'Mark a specific notification as unread.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as unread',
    type: NotificationEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async markAsUnread(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<NotificationEntity> {
    const user = (req as any).user;
    const isAdmin = user.role === UserRole.ADMIN;

    return this.notificationService.markAsUnread(id, user.id, isAdmin);
  }

  @Put('bulk/status')
  @ApiOperation({
    summary: 'Bulk update notification statuses',
    description: 'Update the status of multiple notifications at once.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications updated successfully',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number' },
        failed: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async bulkUpdateNotifications(
    @Body() bulkUpdateDto: BulkUpdateNotificationsDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const isAdmin = user.role === UserRole.ADMIN;

    return this.notificationService.bulkUpdateNotifications(
      bulkUpdateDto,
      user.id,
      isAdmin,
    );
  }

  @Put('all/read')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all unread notifications for the current user as read.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number' },
      },
    },
  })
  async markAllAsRead(@Req() req: Request) {
    const user = (req as any).user;
    return this.notificationService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a specific notification.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<void> {
    const user = (req as any).user;
    const isAdmin = user.role === UserRole.ADMIN;

    await this.notificationService.deleteNotification(id, user.id, isAdmin);
  }

  @Delete('bulk')
  @ApiOperation({
    summary: 'Bulk delete notifications',
    description: 'Delete multiple notifications at once.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications deleted successfully',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'number' },
        failed: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async bulkDeleteNotifications(
    @Body() body: { notificationIds: string[] },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const isAdmin = user.role === UserRole.ADMIN;

    return this.notificationService.bulkDeleteNotifications(
      body.notificationIds,
      user.id,
      isAdmin,
    );
  }

  // Admin-only endpoints
  @Post('admin/bulk')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create bulk notifications (Admin only)',
    description:
      'Create notifications for multiple users at once. Admin access required.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk notifications created successfully',
    type: [NotificationEntity],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
  })
  async createBulkNotifications(
    @Body()
    body: {
      userIds: string[];
      notification: Omit<CreateNotificationDto, 'userId'>;
    },
  ): Promise<NotificationEntity[]> {
    return this.notificationService.createBulkNotifications(
      body.userIds,
      body.notification,
    );
  }

  @Get('admin/user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get notifications for specific user (Admin only)',
    description:
      'Retrieve notifications for a specific user. Admin access required.',
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User notifications retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
  })
  async getUserNotifications(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: NotificationQueryDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    query.userId = userId;

    return this.notificationService.getNotifications(query, user.id, true);
  }

  @Get('admin/user/:userId/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get notification statistics for specific user (Admin only)',
    description:
      'Get notification statistics for a specific user. Admin access required.',
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User notification statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
  })
  async getUserNotificationStats(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.notificationService.getNotificationStats(user.id, true, userId);
  }

  @Delete('admin/cleanup')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete old notifications (Admin only)',
    description:
      'Clean up old notifications older than specified days. Admin access required.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Days to keep (default: 30)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Old notifications cleaned up successfully',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
  })
  async cleanupOldNotifications(@Query('days') days?: number) {
    return this.notificationService.deleteOldNotifications(days || 30);
  }
}
