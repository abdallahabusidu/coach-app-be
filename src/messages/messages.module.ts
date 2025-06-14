import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { MessagesController } from './controllers/messages.controller';

// Services
import { MessagesService } from './services/messages.service';
import { MessageRequestService } from './services/message-request.service';

// Gateways
import { MessagesGateway } from './gateways/messages.gateway';

// Entities
import { MessageEntity } from './entities/message.entity';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageRequestEntity } from './entities/message-request.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { ClientProfileEntity } from '../client/entities/client-profile.entity';
import { CoachProfileEntity } from '../coach/entities/coach-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessageEntity,
      ConversationEntity,
      MessageRequestEntity,
      UserEntity,
      ClientProfileEntity,
      CoachProfileEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessageRequestService, MessagesGateway],
  exports: [MessagesService, MessageRequestService, MessagesGateway],
})
export class MessagesModule {}
