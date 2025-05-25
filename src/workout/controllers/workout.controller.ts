import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { WorkoutService } from '../services/workout.service';
import { CreateWorkoutDto } from '../dtos/create-workout.dto';
import { UpdateWorkoutDto } from '../dtos/update-workout.dto';
import { WorkoutQueryDto } from '../dtos/workout-query.dto';
import {
  WorkoutResponseDto,
  WorkoutListResponseDto,
  WorkoutStatsResponseDto,
} from '../dtos/workout-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { FileUploadService } from '../../common/services/file-upload.service';
import { MediaType } from '../entities/workout.entity';

@ApiTags('workouts')
@Controller('workouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkoutController {
  constructor(
    private readonly workoutService: WorkoutService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Create a new workout (Coach only)',
    description: 'Create a new workout with exercises and optional media files',
  })
  @ApiResponse({
    status: 201,
    description: 'Workout created successfully',
    type: WorkoutResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - coach role required',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - workout with same name already exists',
  })
  async create(
    @Body() createWorkoutDto: CreateWorkoutDto,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.workoutService.create(createWorkoutDto);
    return { workout };
  }

  @Post(':id/media')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({
    summary: 'Upload media files for a workout (Coach only)',
    description: 'Upload images, videos, or PDF files for a specific workout',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload media files with their type information',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Media files to upload',
        },
        mediaInfo: {
          type: 'string',
          description: 'JSON string containing media information',
        },
      },
      required: ['files', 'mediaInfo'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Media files uploaded successfully',
    type: WorkoutResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid files or media info',
  })
  @ApiResponse({
    status: 404,
    description: 'Workout not found',
  })
  async uploadMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('mediaInfo') mediaInfoJson: string,
  ): Promise<WorkoutResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    let mediaInfo;
    try {
      mediaInfo = JSON.parse(mediaInfoJson);
    } catch (error) {
      throw new BadRequestException('Invalid media info format');
    }

    if (!Array.isArray(mediaInfo) || mediaInfo.length !== files.length) {
      throw new BadRequestException(
        'Media info must match the number of files',
      );
    }

    // Validate and upload each file
    const uploadedMedia = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const info = mediaInfo[i];

      if (!info.type || !Object.values(MediaType).includes(info.type)) {
        throw new BadRequestException(`Invalid media type: ${info.type}`);
      }

      // Validate file type
      const mediaType = info.type as 'image' | 'video' | 'pdf';
      if (!this.fileUploadService.validateWorkoutMediaFile(file, mediaType)) {
        throw new BadRequestException(
          `Invalid file type for ${mediaType}: ${file.mimetype}`,
        );
      }

      // Check file size
      const maxSize = this.fileUploadService.getMaxFileSize(mediaType);
      if (file.size > maxSize) {
        throw new BadRequestException(
          `File size exceeds limit for ${mediaType}`,
        );
      }

      // Upload file
      const fileUrl = await this.fileUploadService.uploadWorkoutMedia(
        file,
        mediaType,
      );

      uploadedMedia.push({
        type: info.type,
        url: fileUrl,
        title: info.title || file.originalname,
        description: info.description || '',
      });
    }

    // Get current workout and update with new media
    const workout = await this.workoutService.findOne(id);
    const existingMedia = workout.media || [];

    const updatedWorkout = await this.workoutService.update(id, {
      media: [...existingMedia, ...uploadedMedia],
    });

    return { workout: updatedWorkout };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all workouts with filtering and pagination',
    description:
      'Retrieve workouts with optional filtering by type, difficulty, duration, etc.',
  })
  @ApiQuery({ type: WorkoutQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Workouts retrieved successfully',
    type: WorkoutListResponseDto,
  })
  async findAll(
    @Query() queryDto: WorkoutQueryDto,
  ): Promise<WorkoutListResponseDto> {
    return await this.workoutService.findAll(queryDto);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get workout statistics',
    description:
      'Get comprehensive statistics about all workouts in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: WorkoutStatsResponseDto,
  })
  async getStatistics(): Promise<WorkoutStatsResponseDto> {
    return await this.workoutService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific workout',
    description: 'Retrieve detailed information about a specific workout',
  })
  @ApiResponse({
    status: 200,
    description: 'Workout retrieved successfully',
    type: WorkoutResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Workout not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.workoutService.findOne(id);
    return { workout };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Update a workout (Coach only)',
    description: 'Update an existing workout with new information',
  })
  @ApiResponse({
    status: 200,
    description: 'Workout updated successfully',
    type: WorkoutResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Workout not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - workout with same name already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkoutDto: UpdateWorkoutDto,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.workoutService.update(id, updateWorkoutDto);
    return { workout };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Delete a workout (Coach only)',
    description: 'Delete a workout and all associated media files',
  })
  @ApiResponse({
    status: 200,
    description: 'Workout deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Workout deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Workout not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    // Get workout to delete associated media files
    const workout = await this.workoutService.findOne(id);

    // Delete associated media files
    if (workout.media && workout.media.length > 0) {
      for (const media of workout.media) {
        try {
          await this.fileUploadService.deleteFile(media.url);
        } catch (error) {
          // Log error but don't fail the deletion
          console.warn(`Failed to delete media file: ${media.url}`, error);
        }
      }
    }

    await this.workoutService.remove(id);
    return { message: 'Workout deleted successfully' };
  }

  @Delete(':id/media/:mediaIndex')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Delete a specific media file from workout (Coach only)',
    description: 'Remove a specific media file from a workout',
  })
  @ApiResponse({
    status: 200,
    description: 'Media file deleted successfully',
    type: WorkoutResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Workout or media not found',
  })
  async removeMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaIndex') mediaIndex: string,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.workoutService.findOne(id);
    const index = parseInt(mediaIndex);

    if (isNaN(index) || index < 0 || index >= workout.media.length) {
      throw new BadRequestException('Invalid media index');
    }

    // Delete the file
    const mediaToDelete = workout.media[index];
    try {
      await this.fileUploadService.deleteFile(mediaToDelete.url);
    } catch (error) {
      console.warn(`Failed to delete media file: ${mediaToDelete.url}`, error);
    }

    // Remove from media array
    const updatedMedia = workout.media.filter((_, i) => i !== index);
    const updatedWorkout = await this.workoutService.update(id, {
      media: updatedMedia,
    });

    return { workout: updatedWorkout };
  }
}
