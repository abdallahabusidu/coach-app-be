import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { FeedPostEntity } from './entities/feed-post.entity';
import { FeedInteractionEntity } from './entities/feed-interaction.entity';
import { UserEntity } from '../auth/entities/user.entity';

// Services
import { FeedService } from './services/feed.service';

// Controllers
import { FeedController } from './controllers/feed.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeedPostEntity,
      FeedInteractionEntity,
      UserEntity,
    ]),
    ScheduleModule.forRoot(), // For scheduled posts and cleanup jobs
  ],
  providers: [FeedService],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}
