import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { NotificationService } from '../notifications/services/notification.service';
import { CreateNotificationDto } from '../notifications/dtos/create-notification.dto';
import {
  NotificationType,
  NotificationStatus,
} from '../notifications/entities/notification.entity';

export async function seedNotifications() {
  const app = await NestFactory.create(AppModule);
  const notificationService = app.get(NotificationService);

  console.log('🔔 Clearing existing notifications...');
  // Note: You might want to add a clearAll method to NotificationService for this

  // Sample notifications for different users and scenarios
  const notifications: CreateNotificationDto[] = [
    // Welcome notifications
    {
      userId: '11111111-1111-1111-1111-111111111111', // Sample coach ID
      type: NotificationType.SYSTEM_UPDATE,
      header: 'Welcome to Coach App!',
      description:
        'Thank you for joining our coaching platform. Start exploring the features to enhance your coaching experience.',
      navigationLink: '/dashboard',
      metadata: {
        priority: 'normal' as const,
        source: 'onboarding',
        feature: 'welcome',
      },
    },

    // Achievement notifications
    {
      userId: '22222222-2222-2222-2222-222222222222', // Sample client ID
      type: NotificationType.GOAL_ACHIEVED,
      header: 'Congratulations! 🎉',
      description:
        'You have completed 10 workouts this month! Keep up the excellent work.',
      navigationLink: '/dashboard/achievements',
      metadata: {
        priority: 'high' as const,
        achievementType: 'workout_milestone',
        count: 10,
        period: 'month',
      },
    },

    // Payment notifications
    {
      userId: '11111111-1111-1111-1111-111111111111',
      type: NotificationType.PAYMENT_DUE,
      header: 'Payment Received',
      description:
        'You have received a payment of $150 from John Doe for Premium Coaching Package.',
      navigationLink: '/dashboard/payments',
      metadata: {
        priority: 'high' as const,
        amount: 150,
        currency: 'USD',
        clientName: 'John Doe',
        packageName: 'Premium Coaching Package',
        transactionId: 'txn_123456789',
      },
    },

    // Reminder notifications
    {
      userId: '22222222-2222-2222-2222-222222222222',
      type: NotificationType.WORKOUT_REMINDER,
      header: 'Workout Reminder',
      description:
        'Don\'t forget your scheduled workout "Upper Body Strength" at 3:00 PM today.',
      navigationLink: '/workouts/123',
      metadata: {
        priority: 'normal' as const,
        workoutName: 'Upper Body Strength',
        scheduledTime: '15:00',
        workoutId: 'workout_123',
      },
    },

    // Message notifications
    {
      userId: '11111111-1111-1111-1111-111111111111',
      type: NotificationType.MESSAGE_RECEIVED,
      header: 'New Message from Client',
      description: 'Sarah Johnson sent you a message about her nutrition plan.',
      navigationLink: '/messages/conv_456',
      metadata: {
        priority: 'normal' as const,
        senderName: 'Sarah Johnson',
        senderId: '33333333-3333-3333-3333-333333333333',
        messagePreview:
          'Hi Coach, I have a question about my nutrition plan...',
        conversationId: 'conv_456',
      },
    },

    // System maintenance notifications
    {
      userId: '11111111-1111-1111-1111-111111111111',
      type: NotificationType.SYSTEM_UPDATE,
      header: 'Scheduled Maintenance',
      description:
        'The platform will undergo maintenance on Sunday, 2:00 AM - 4:00 AM EST. Some features may be temporarily unavailable.',
      metadata: {
        priority: 'low' as const,
        maintenanceStart: '2024-01-21T07:00:00Z',
        maintenanceEnd: '2024-01-21T09:00:00Z',
        affectedFeatures: ['messaging', 'video_calls'],
      },
    },

    // Security notifications
    {
      userId: '11111111-1111-1111-1111-111111111111',
      type: NotificationType.SYSTEM_UPDATE,
      header: '🚨 Urgent: Security Alert',
      description:
        'Unusual login activity detected on your account. Please review your recent login activity and change your password if necessary.',
      navigationLink: '/security/login-activity',
      metadata: {
        priority: 'urgent' as const,
        securityEvent: 'unusual_login',
        loginLocation: 'New York, NY',
        loginTime: new Date().toISOString(),
        ipAddress: '192.168.1.100',
        actionRequired: true,
      },
    },

    // Feature update notifications
    {
      userId: '22222222-2222-2222-2222-222222222222',
      type: NotificationType.SYSTEM_UPDATE,
      header: 'New Feature: Progress Photos',
      description:
        'You can now upload progress photos to track your transformation journey. Check out the new feature in your profile.',
      navigationLink: '/profile/progress-photos',
      metadata: {
        priority: 'low' as const,
        featureName: 'progress_photos',
        featureUrl: '/profile/progress-photos',
        releaseDate: '2024-01-15',
      },
    },

    // Subscription notifications
    {
      userId: '11111111-1111-1111-1111-111111111111',
      type: NotificationType.SUBSCRIPTION_EXPIRED,
      header: 'Subscription Renewal Reminder',
      description:
        'Your Pro Coach subscription will renew in 3 days. Your card ending in 4242 will be charged $29.99.',
      navigationLink: '/billing/subscription',
      metadata: {
        priority: 'normal' as const,
        subscriptionType: 'pro_coach',
        renewalDate: '2024-01-25',
        amount: 29.99,
        currency: 'USD',
        cardLast4: '4242',
      },
    },

    // New trainee notifications
    {
      userId: '11111111-1111-1111-1111-111111111111',
      type: NotificationType.NEW_TRAINEE_JOINED,
      header: 'New Trainee Joined!',
      description:
        'Mike Thompson has joined your coaching program and is ready to start their fitness journey.',
      navigationLink: '/trainees/mike-thompson',
      metadata: {
        priority: 'normal' as const,
        traineeName: 'Mike Thompson',
        traineeId: '44444444-4444-4444-4444-444444444444',
        joinDate: new Date().toISOString(),
        programType: 'weight_loss',
      },
    },
  ];

  // Create notifications
  let createdCount = 0;
  for (const notificationData of notifications) {
    try {
      await notificationService.createNotification(notificationData);
      createdCount++;
    } catch (error) {
      console.error(
        `Failed to create notification: ${notificationData.header}`,
        error.message,
      );
    }
  }

  console.log(`✅ Seeded ${createdCount} notifications`);
  await app.close();
}
