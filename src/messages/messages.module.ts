import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { MessagesController } from './controllers/messages.controller';

// Services
import { MessageRequestService } from './services/message-request.service';
import { MessagesService } from './services/messages.service';

// Gateways
import { MessagesGateway } from './gateways/messages.gateway';

// Entities
import { UserEntity } from '../auth/entities/user.entity';
import { ClientProfileEntity } from '../client/entities/client-profile.entity';
import { CoachProfileEntity } from '../coach/entities/coach-profile.entity';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageRequestEntity } from './entities/message-request.entity';
import { MessageEntity } from './entities/message.entity';

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
