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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { FeedService } from '../services/feed.service';
import {
  CreateFeedPostDto,
  UpdateFeedPostDto,
  CreateFeedInteractionDto,
  FeedQueryDto,
  FeedPostResponseDto,
  FeedAnalyticsDto,
} from '../dtos/feed.dto';
import {
  ApiCreateResponses,
  ApiCrudResponses,
  ApiUpdateResponses,
  ApiDeleteResponses,
  ApiPaginatedResponse,
  ApiAuthResponses,
  ApiSuccessResponse,
} from '../../common/decorators/api-responses.decorator';

@ApiTags('Coach Feed & Posts')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  // Public endpoints (no auth required)
  @Get('public')
  @ApiOperation({
    summary: 'Get public feed posts',
    description: 'Retrieve public feed posts that are visible to all users',
  })
  @ApiPaginatedResponse(
    FeedPostResponseDto,
    'Public feed retrieved successfully',
  )
  async getPublicFeed(
    @Query() query: FeedQueryDto,
  ): Promise<{ posts: FeedPostResponseDto[]; total: number }> {
    return this.feedService.getPublicFeed(query);
  }

  @Get('trending')
  @ApiOperation({
    summary: 'Get trending feed posts',
    description:
      'Retrieve currently trending posts based on engagement metrics',
  })
  @ApiPaginatedResponse(
    FeedPostResponseDto,
    'Trending feed retrieved successfully',
  )
  async getTrendingFeed(
    @Query() query: FeedQueryDto,
  ): Promise<{ posts: FeedPostResponseDto[]; total: number }> {
    return this.feedService.getTrendingFeed(query);
  }

  @Get('post/:postId/public')
  @ApiOperation({
    summary: 'Get single public feed post',
    description: 'Retrieve a specific public feed post by ID',
  })
  @ApiCrudResponses('Feed Post', FeedPostResponseDto)
  async getPublicFeedPost(
    @Param('postId') postId: string,
  ): Promise<FeedPostResponseDto> {
    return this.feedService.getFeedPost(postId);
  }

  // Authenticated endpoints
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('personalized')
  @ApiOperation({ summary: 'Get personalized feed for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Personalized feed retrieved successfully',
  })
  async getPersonalizedFeed(
    @Request() req,
    @Query() query: FeedQueryDto,
  ): Promise<{ posts: FeedPostResponseDto[]; total: number }> {
    const userId = req.user.id;
    return this.feedService.getPersonalizedFeed(userId, query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('post/:postId')
  @ApiOperation({ summary: 'Get single feed post (with user interactions)' })
  @ApiResponse({ status: 200, description: 'Feed post retrieved successfully' })
  async getFeedPost(
    @Request() req,
    @Param('postId') postId: string,
  ): Promise<FeedPostResponseDto> {
    const userId = req.user.id;
    return this.feedService.getFeedPost(postId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('post/:postId/interact')
  @ApiOperation({
    summary: 'Interact with a feed post (like, comment, share, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Interaction recorded successfully',
  })
  @HttpCode(HttpStatus.OK)
  async createInteraction(
    @Request() req,
    @Param('postId') postId: string,
    @Body() createInteractionDto: CreateFeedInteractionDto,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user.id;
    return this.feedService.createInteraction(
      postId,
      userId,
      createInteractionDto,
    );
  }

  // Coach-only endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiBearerAuth()
  @Post('posts')
  @ApiOperation({ summary: 'Create a new feed post (Coach only)' })
  @ApiResponse({ status: 201, description: 'Feed post created successfully' })
  async createFeedPost(
    @Request() req,
    @Body() createPostDto: CreateFeedPostDto,
  ): Promise<FeedPostResponseDto> {
    const coachId = req.user.id;
    return this.feedService.createFeedPost(coachId, createPostDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiBearerAuth()
  @Get('my-posts')
  @ApiOperation({ summary: 'Get coach own feed posts' })
  @ApiResponse({
    status: 200,
    description: 'Coach feed posts retrieved successfully',
  })
  async getMyFeedPosts(
    @Request() req,
    @Query() query: FeedQueryDto,
  ): Promise<{ posts: FeedPostResponseDto[]; total: number }> {
    const coachId = req.user.id;
    return this.feedService.getCoachFeedPosts(coachId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiBearerAuth()
  @Put('posts/:postId')
  @ApiOperation({ summary: 'Update feed post (Coach only)' })
  @ApiResponse({ status: 200, description: 'Feed post updated successfully' })
  async updateFeedPost(
    @Request() req,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdateFeedPostDto,
  ): Promise<FeedPostResponseDto> {
    const coachId = req.user.id;
    return this.feedService.updateFeedPost(coachId, postId, updatePostDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiBearerAuth()
  @Delete('posts/:postId')
  @ApiOperation({ summary: 'Delete feed post (Coach only)' })
  @ApiResponse({ status: 200, description: 'Feed post deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteFeedPost(
    @Request() req,
    @Param('postId') postId: string,
  ): Promise<{ success: boolean; message: string }> {
    const coachId = req.user.id;
    await this.feedService.deleteFeedPost(coachId, postId);
    return { success: true, message: 'Feed post deleted successfully' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiBearerAuth()
  @Get('analytics')
  @ApiOperation({ summary: 'Get feed analytics for coach' })
  @ApiResponse({
    status: 200,
    description: 'Feed analytics retrieved successfully',
  })
  async getFeedAnalytics(@Request() req): Promise<FeedAnalyticsDto> {
    const coachId = req.user.id;
    return this.feedService.getFeedAnalytics(coachId);
  }

  // Special content type endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiBearerAuth()
  @Post('workout-tip')
  @ApiOperation({ summary: 'Create a workout tip post' })
  @ApiResponse({
    status: 201,
    description: 'Workout tip post created successfully',
  })
  async createWorkoutTip(
    @Request() req,
    @Body()
    workoutTipData: {
      title: string;
      content: string;
      workoutTip: {
        targetMuscles: string[];
        equipment: string[];
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        description: string;
        instructions?: string[];
        commonMistakes?: string[];
        variations?: string[];
        safetyTips?: string[];
      };
      hashtags?: string[];
      media?: any[];
    },
  ): Promise<FeedPostResponseDto> {
    const coachId = req.user.id;
    const createPostDto: CreateFeedPostDto = {
      postType: 'workout_tip' as any,
      title: workoutTipData.title,
      content: workoutTipData.content,
      workoutTip: {
        title: workoutTipData.title,
        ...workoutTipData.workoutTip,
      },
      hashtags: workoutTipData.hashtags,
      media: workoutTipData.media,
    };
    return this.feedService.createFeedPost(coachId, createPostDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiBearerAuth()
  @Post('recipe')
  @ApiOperation({ summary: 'Create a recipe post' })
  @ApiResponse({ status: 201, description: 'Recipe post created successfully' })
  async createRecipe(
    @Request() req,
    @Body()
    recipeData: {
      title: string;
      content: string;
      recipe: {
        title: string;
        description: string;
        ingredients: Array<{
          name: string;
          amount: string;
          unit: string;
          notes?: string;
        }>;
        instructions: Array<{
          step: number;
          instruction: string;
          duration?: number;
          temperature?: string;
        }>;
        nutrition: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber?: number;
          sugar?: number;
        };
        prepTime: number;
        cookTime: number;
        servings: number;
        difficulty: 'easy' | 'medium' | 'hard';
        dietaryTags?: string[];
      };
      hashtags?: string[];
      media?: any[];
    },
  ): Promise<FeedPostResponseDto> {
    const coachId = req.user.id;
    const createPostDto: CreateFeedPostDto = {
      postType: 'recipe' as any,
      title: recipeData.title,
      content: recipeData.content,
      recipe: recipeData.recipe,
      hashtags: recipeData.hashtags,
      media: recipeData.media,
    };
    return this.feedService.createFeedPost(coachId, createPostDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiBearerAuth()
  @Post('challenge')
  @ApiOperation({ summary: 'Create a challenge post' })
  @ApiResponse({
    status: 201,
    description: 'Challenge post created successfully',
  })
  async createChallenge(
    @Request() req,
    @Body()
    challengeData: {
      title: string;
      content: string;
      challenge: {
        title: string;
        description: string;
        type: 'workout' | 'nutrition' | 'habit' | 'mindset';
        duration: number;
        startDate: string;
        endDate: string;
        rewards?: string[];
        rules?: string[];
        trackingMetrics?: string[];
      };
      hashtags?: string[];
      media?: any[];
    },
  ): Promise<FeedPostResponseDto> {
    const coachId = req.user.id;
    const createPostDto: CreateFeedPostDto = {
      postType: 'challenge' as any,
      title: challengeData.title,
      content: challengeData.content,
      challenge: {
        ...challengeData.challenge,
        startDate: new Date(challengeData.challenge.startDate),
        endDate: new Date(challengeData.challenge.endDate),
      },
      hashtags: challengeData.hashtags,
      media: challengeData.media,
    };
    return this.feedService.createFeedPost(coachId, createPostDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiBearerAuth()
  @Post('poll')
  @ApiOperation({ summary: 'Create a poll post' })
  @ApiResponse({ status: 201, description: 'Poll post created successfully' })
  async createPoll(
    @Request() req,
    @Body()
    pollData: {
      title: string;
      content: string;
      poll: {
        question: string;
        options: Array<{
          id: string;
          text: string;
        }>;
        allowMultipleChoices: boolean;
        expiresAt?: string;
      };
      hashtags?: string[];
    },
  ): Promise<FeedPostResponseDto> {
    const coachId = req.user.id;
    const createPostDto: CreateFeedPostDto = {
      postType: 'poll' as any,
      title: pollData.title,
      content: pollData.content,
      poll: {
        ...pollData.poll,
        options: pollData.poll.options.map((option) => ({
          ...option,
          voteCount: 0,
        })),
        totalVotes: 0,
        expiresAt: pollData.poll.expiresAt
          ? new Date(pollData.poll.expiresAt)
          : undefined,
      },
      hashtags: pollData.hashtags,
    };
    return this.feedService.createFeedPost(coachId, createPostDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiBearerAuth()
  @Post('live-session')
  @ApiOperation({ summary: 'Create a live session announcement post' })
  @ApiResponse({
    status: 201,
    description: 'Live session post created successfully',
  })
  async createLiveSession(
    @Request() req,
    @Body()
    liveSessionData: {
      title: string;
      content: string;
      liveSession: {
        title: string;
        description: string;
        type: 'workout' | 'nutrition' | 'q_and_a' | 'motivation';
        scheduledAt: string;
        duration: number;
        maxParticipants?: number;
        meetingLink?: string;
        isRecorded: boolean;
      };
      hashtags?: string[];
    },
  ): Promise<FeedPostResponseDto> {
    const coachId = req.user.id;
    const createPostDto: CreateFeedPostDto = {
      postType: 'live_session' as any,
      title: liveSessionData.title,
      content: liveSessionData.content,
      liveSession: {
        ...liveSessionData.liveSession,
        scheduledAt: new Date(liveSessionData.liveSession.scheduledAt),
        currentParticipants: 0,
        recordingUrl: undefined,
      },
      hashtags: liveSessionData.hashtags,
    };
    return this.feedService.createFeedPost(coachId, createPostDto);
  }

  // Quick actions for common interactions
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('post/:postId/like')
  @ApiOperation({ summary: 'Like a feed post' })
  @ApiResponse({ status: 200, description: 'Post liked successfully' })
  @HttpCode(HttpStatus.OK)
  async likePost(
    @Request() req,
    @Param('postId') postId: string,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user.id;
    return this.feedService.createInteraction(postId, userId, {
      interactionType: 'like' as any,
      reactionType: 'like' as any,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('post/:postId/save')
  @ApiOperation({ summary: 'Save a feed post' })
  @ApiResponse({ status: 200, description: 'Post saved successfully' })
  @HttpCode(HttpStatus.OK)
  async savePost(
    @Request() req,
    @Param('postId') postId: string,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user.id;
    return this.feedService.createInteraction(postId, userId, {
      interactionType: 'save' as any,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('post/:postId/share')
  @ApiOperation({ summary: 'Share a feed post' })
  @ApiResponse({ status: 200, description: 'Post shared successfully' })
  @HttpCode(HttpStatus.OK)
  async sharePost(
    @Request() req,
    @Param('postId') postId: string,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user.id;
    return this.feedService.createInteraction(postId, userId, {
      interactionType: 'share' as any,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('post/:postId/comment')
  @ApiOperation({ summary: 'Comment on a feed post' })
  @ApiResponse({ status: 200, description: 'Comment added successfully' })
  @HttpCode(HttpStatus.OK)
  async commentOnPost(
    @Request() req,
    @Param('postId') postId: string,
    @Body() commentData: { comment: string },
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user.id;
    return this.feedService.createInteraction(postId, userId, {
      interactionType: 'comment' as any,
      commentText: commentData.comment,
    });
  }

  // Utility endpoints
  @Get('hashtags/trending')
  @ApiOperation({ summary: 'Get trending hashtags' })
  @ApiResponse({
    status: 200,
    description: 'Trending hashtags retrieved successfully',
  })
  async getTrendingHashtags(): Promise<{
    hashtags: Array<{
      hashtag: string;
      count: number;
      growth: number;
    }>;
  }> {
    // This would be implemented with real hashtag analytics
    return {
      hashtags: [
        { hashtag: 'fitness', count: 156, growth: 25 },
        { hashtag: 'workout', count: 134, growth: 18 },
        { hashtag: 'nutrition', count: 98, growth: 32 },
        { hashtag: 'motivation', count: 87, growth: 15 },
        { hashtag: 'health', count: 76, growth: 22 },
        { hashtag: 'weightloss', count: 65, growth: 28 },
        { hashtag: 'muscle', count: 54, growth: 12 },
        { hashtag: 'cardio', count: 43, growth: 35 },
        { hashtag: 'strength', count: 39, growth: 20 },
        { hashtag: 'wellness', count: 31, growth: 40 },
      ],
    };
  }

  @Get('content-ideas')
  @ApiOperation({ summary: 'Get content ideas for coaches' })
  @ApiResponse({
    status: 200,
    description: 'Content ideas retrieved successfully',
  })
  async getContentIdeas(): Promise<{
    ideas: Array<{
      category: string;
      title: string;
      description: string;
      type: string;
      hashtags: string[];
    }>;
  }> {
    return {
      ideas: [
        {
          category: 'Workout Tips',
          title: 'Perfect Push-Up Form',
          description: 'Share the key points for proper push-up execution',
          type: 'workout_tip',
          hashtags: ['pushups', 'form', 'workout', 'fitness'],
        },
        {
          category: 'Nutrition',
          title: 'High-Protein Breakfast Ideas',
          description: 'Share 5 quick and easy high-protein breakfast recipes',
          type: 'recipe',
          hashtags: ['breakfast', 'protein', 'nutrition', 'healthy'],
        },
        {
          category: 'Motivation',
          title: 'Monday Motivation',
          description: 'Inspire your clients to start the week strong',
          type: 'motivation',
          hashtags: ['monday', 'motivation', 'goals', 'mindset'],
        },
        {
          category: 'Challenge',
          title: '7-Day Water Challenge',
          description: 'Challenge clients to drink more water daily',
          type: 'challenge',
          hashtags: ['water', 'challenge', 'health', 'hydration'],
        },
        {
          category: 'Success Story',
          title: 'Client Transformation',
          description: 'Share a client success story (with permission)',
          type: 'success_story',
          hashtags: ['transformation', 'success', 'results', 'inspiration'],
        },
      ],
    };
  }
}
