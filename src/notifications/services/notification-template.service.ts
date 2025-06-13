import { Injectable } from '@nestjs/common';
import { NotificationType } from '../entities/notification.entity';

export interface NotificationTemplate {
  header: string;
  description: string;
  navigationLink?: string;
  metadata?: Record<string, any>;
}

export interface TemplateVariables {
  [key: string]: any;
}

@Injectable()
export class NotificationTemplateService {
  /**
   * Get notification template by type with variable substitution
   */
  getTemplate(
    type: NotificationType,
    variables: TemplateVariables = {},
  ): NotificationTemplate {
    const templates = this.getTemplateDefinitions();
    const template = templates[type];

    if (!template) {
      throw new Error(`No template found for notification type: ${type}`);
    }

    return {
      header: this.substituteVariables(template.header, variables),
      description: this.substituteVariables(template.description, variables),
      navigationLink: template.navigationLink
        ? this.substituteVariables(template.navigationLink, variables)
        : undefined,
      metadata: {
        ...template.metadata,
        ...variables.metadata,
        priority: template.metadata?.priority || 'normal',
      },
    };
  }

  /**
   * Create a notification from template
   */
  createFromTemplate(
    type: NotificationType,
    userId: string,
    variables: TemplateVariables = {},
  ) {
    const template = this.getTemplate(type, variables);

    return {
      type,
      userId,
      header: template.header,
      description: template.description,
      navigationLink: template.navigationLink,
      metadata: template.metadata,
    };
  }

  /**
   * Define all notification templates
   */
  private getTemplateDefinitions(): Record<
    NotificationType,
    NotificationTemplate
  > {
    return {
      [NotificationType.TASK_COMPLETED]: {
        header: '✅ Task Completed!',
        description:
          '{{traineeName}} has completed the task "{{taskName}}". Great progress!',
        navigationLink: '/dashboard/trainees/{{traineeId}}/progress',
        metadata: {
          priority: 'normal',
          entityType: 'task',
          actionRequired: false,
        },
      },

      [NotificationType.MISSED_TASK]: {
        header: '⚠️ Missed Task Alert',
        description:
          '{{traineeName}} missed the task "{{taskName}}" that was due on {{dueDate}}. Consider following up.',
        navigationLink: '/dashboard/trainees/{{traineeId}}/tasks',
        metadata: {
          priority: 'high',
          entityType: 'task',
          actionRequired: true,
        },
      },

      [NotificationType.NEW_TRAINEE_JOINED]: {
        header: '🎉 New Trainee Joined!',
        description:
          '{{traineeName}} has joined your coaching program. Welcome them to start their fitness journey!',
        navigationLink: '/dashboard/trainees/{{traineeId}}',
        metadata: {
          priority: 'normal',
          entityType: 'trainee',
          actionRequired: true,
        },
      },

      [NotificationType.MESSAGE_RECEIVED]: {
        header: '💬 New Message',
        description:
          'You have received a new message from {{senderName}}: "{{messagePreview}}"',
        navigationLink: '/dashboard/messages/{{messageId}}',
        metadata: {
          priority: 'normal',
          entityType: 'message',
          actionRequired: true,
        },
      },

      [NotificationType.PAYMENT_DUE]: {
        header: '💳 Payment Due',
        description:
          'Payment of ${{amount}} from {{traineeName}} is due on {{dueDate}}.',
        navigationLink: '/dashboard/billing/{{paymentId}}',
        metadata: {
          priority: 'high',
          entityType: 'payment',
          actionRequired: true,
        },
      },

      [NotificationType.WORKOUT_REMINDER]: {
        header: '🏋️ Workout Reminder',
        description:
          "Don't forget your {{workoutType}} workout scheduled for {{scheduledTime}}!",
        navigationLink: '/dashboard/workouts/{{workoutId}}',
        metadata: {
          priority: 'normal',
          entityType: 'workout',
          actionRequired: false,
        },
      },

      [NotificationType.MEAL_REMINDER]: {
        header: '🍽️ Meal Reminder',
        description:
          "Time for your {{mealType}}! Check your nutrition plan for today's meal.",
        navigationLink: '/dashboard/nutrition/{{mealPlanId}}',
        metadata: {
          priority: 'normal',
          entityType: 'meal',
          actionRequired: false,
        },
      },

      [NotificationType.GOAL_ACHIEVED]: {
        header: '🎯 Goal Achieved!',
        description:
          'Congratulations! {{traineeName}} has achieved their goal: {{goalName}}.',
        navigationLink: '/dashboard/trainees/{{traineeId}}/goals',
        metadata: {
          priority: 'normal',
          entityType: 'goal',
          actionRequired: false,
        },
      },

      [NotificationType.SUBSCRIPTION_EXPIRED]: {
        header: '⚠️ Subscription Expired',
        description:
          "{{traineeName}}'s subscription has expired. They may need to renew to continue accessing their program.",
        navigationLink: '/dashboard/billing/{{subscriptionId}}',
        metadata: {
          priority: 'urgent',
          entityType: 'subscription',
          actionRequired: true,
        },
      },

      [NotificationType.CERTIFICATE_EXPIRING]: {
        header: '📜 Certificate Expiring Soon',
        description:
          'Your {{certificateType}} certificate will expire on {{expiryDate}}. Renew it to maintain your credentials.',
        navigationLink: '/dashboard/certificates/{{certificateId}}',
        metadata: {
          priority: 'high',
          entityType: 'certificate',
          actionRequired: true,
        },
      },

      [NotificationType.PROFILE_INCOMPLETE]: {
        header: '👤 Complete Your Profile',
        description:
          "{{traineeName}}'s profile is incomplete. Missing: {{missingFields}}. A complete profile helps provide better coaching.",
        navigationLink: '/dashboard/trainees/{{traineeId}}/profile',
        metadata: {
          priority: 'normal',
          entityType: 'profile',
          actionRequired: true,
        },
      },

      [NotificationType.SYSTEM_UPDATE]: {
        header: '🔔 System Update',
        description: '{{updateTitle}}: {{updateDescription}}',
        navigationLink: '/dashboard/updates/{{updateId}}',
        metadata: {
          priority: 'normal',
          entityType: 'system',
          actionRequired: false,
        },
      },

      [NotificationType.PROMOTIONAL]: {
        header: '🎁 {{promoTitle}}',
        description: '{{promoDescription}} Valid until {{expiryDate}}.',
        navigationLink: '/dashboard/promotions/{{promoId}}',
        metadata: {
          priority: 'low',
          entityType: 'promotion',
          actionRequired: false,
        },
      },
    };
  }

  /**
   * Substitute variables in template strings
   */
  private substituteVariables(
    template: string,
    variables: TemplateVariables,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Get template preview with example data
   */
  getTemplatePreview(type: NotificationType): NotificationTemplate {
    const exampleVariables = this.getExampleVariables();
    return this.getTemplate(type, exampleVariables);
  }

  /**
   * Get example variables for template previews
   */
  private getExampleVariables(): TemplateVariables {
    return {
      traineeName: 'John Doe',
      taskName: 'Morning Cardio',
      traineeId: '123e4567-e89b-12d3-a456-426614174000',
      dueDate: 'January 15, 2024',
      senderName: 'Jane Smith',
      messagePreview: 'How should I adjust my diet plan?',
      messageId: '123e4567-e89b-12d3-a456-426614174001',
      amount: '99.99',
      paymentId: '123e4567-e89b-12d3-a456-426614174002',
      workoutType: 'Upper Body Strength',
      scheduledTime: '6:00 AM',
      workoutId: '123e4567-e89b-12d3-a456-426614174003',
      mealType: 'breakfast',
      mealPlanId: '123e4567-e89b-12d3-a456-426614174004',
      goalName: 'Lose 10 pounds',
      subscriptionId: '123e4567-e89b-12d3-a456-426614174005',
      certificateType: 'Personal Training',
      expiryDate: 'March 15, 2024',
      certificateId: '123e4567-e89b-12d3-a456-426614174006',
      missingFields: 'emergency contact, medical history',
      updateTitle: 'New Workout Templates Available',
      updateDescription:
        "We've added 15 new workout templates to help you create better programs.",
      updateId: '123e4567-e89b-12d3-a456-426614174007',
      promoTitle: 'Special Offer',
      promoDescription: 'Get 20% off on all premium features this month',
      promoId: '123e4567-e89b-12d3-a456-426614174008',
    };
  }

  /**
   * Validate template variables
   */
  validateTemplate(
    type: NotificationType,
    variables: TemplateVariables,
  ): {
    isValid: boolean;
    missingVariables: string[];
  } {
    const template = this.getTemplateDefinitions()[type];
    if (!template) {
      return { isValid: false, missingVariables: [] };
    }

    const requiredVariables = this.extractVariables(template.header)
      .concat(this.extractVariables(template.description))
      .concat(
        template.navigationLink
          ? this.extractVariables(template.navigationLink)
          : [],
      );

    const missingVariables = requiredVariables.filter(
      (variable) => variables[variable] === undefined,
    );

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
    };
  }

  /**
   * Extract variable names from template string
   */
  private extractVariables(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];

    return matches.map((match) => match.replace(/[{}]/g, ''));
  }

  /**
   * Get all available notification types with descriptions
   */
  getAvailableTypes(): Array<{
    type: NotificationType;
    description: string;
    category: string;
  }> {
    return [
      {
        type: NotificationType.TASK_COMPLETED,
        description: 'Sent when a trainee completes a task',
        category: 'Progress',
      },
      {
        type: NotificationType.MISSED_TASK,
        description: 'Sent when a trainee misses a scheduled task',
        category: 'Progress',
      },
      {
        type: NotificationType.NEW_TRAINEE_JOINED,
        description: 'Sent when a new trainee joins the program',
        category: 'User Management',
      },
      {
        type: NotificationType.MESSAGE_RECEIVED,
        description: 'Sent when a new message is received',
        category: 'Communication',
      },
      {
        type: NotificationType.PAYMENT_DUE,
        description: 'Sent when a payment is due',
        category: 'Billing',
      },
      {
        type: NotificationType.WORKOUT_REMINDER,
        description: 'Reminder for scheduled workouts',
        category: 'Reminders',
      },
      {
        type: NotificationType.MEAL_REMINDER,
        description: 'Reminder for scheduled meals',
        category: 'Reminders',
      },
      {
        type: NotificationType.GOAL_ACHIEVED,
        description: 'Sent when a trainee achieves a goal',
        category: 'Progress',
      },
      {
        type: NotificationType.SUBSCRIPTION_EXPIRED,
        description: 'Sent when a subscription expires',
        category: 'Billing',
      },
      {
        type: NotificationType.CERTIFICATE_EXPIRING,
        description: 'Sent when a certificate is about to expire',
        category: 'Credentials',
      },
      {
        type: NotificationType.PROFILE_INCOMPLETE,
        description: 'Sent when a user profile is incomplete',
        category: 'User Management',
      },
      {
        type: NotificationType.SYSTEM_UPDATE,
        description: 'Sent for system updates and announcements',
        category: 'System',
      },
      {
        type: NotificationType.PROMOTIONAL,
        description: 'Sent for promotional offers and marketing',
        category: 'Marketing',
      },
    ];
  }
}
