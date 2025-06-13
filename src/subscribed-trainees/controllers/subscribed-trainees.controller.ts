import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { SubscribedTraineesService } from '../services/subscribed-trainees.service';
import { CsvImportService } from '../services/csv-import.service';
import {
  TraineeFilterDto,
  TraineeListResponseDto,
  TraineeResponseDto,
  CsvImportResultDto,
} from '../dtos/subscribed-trainees.dto';

@ApiTags('Subscribed Trainees')
@Controller('subscribed-trainees')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubscribedTraineesController {
  constructor(
    private readonly subscribedTraineesService: SubscribedTraineesService,
    private readonly csvImportService: CsvImportService,
  ) {}

  @Get()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get filtered list of subscribed trainees',
    description:
      'Retrieve a paginated and filtered list of trainees subscribed to the coach with advanced filtering options',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of subscribed trainees retrieved successfully',
    type: TraineeListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Coach or Admin access required',
  })
  async getSubscribedTrainees(
    @Query() filters: TraineeFilterDto,
    @Req() req: Request,
  ): Promise<TraineeListResponseDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.subscribedTraineesService.getSubscribedTrainees(
      coachId,
      filters,
    );
  }

  @Get('filter-options')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get available filter options',
    description:
      'Retrieve available options for dropdown filters (goals and plans)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Filter options retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        goals: {
          type: 'array',
          items: { type: 'string' },
          description: 'Available fitness goals',
        },
        plans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
            },
          },
          description: 'Available subscription plans',
        },
      },
    },
  })
  async getFilterOptions() {
    const [goals, plans] = await Promise.all([
      this.subscribedTraineesService.getAvailableGoals(),
      this.subscribedTraineesService.getAvailablePlans(),
    ]);

    return { goals, plans };
  }

  @Get('csv-template')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Download CSV import template',
    description:
      'Download a CSV template file with all available fields for trainee import',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV template downloaded successfully',
    headers: {
      'Content-Type': {
        description: 'MIME type of the response',
        schema: { type: 'string', example: 'text/csv' },
      },
      'Content-Disposition': {
        description: 'Attachment disposition',
        schema: {
          type: 'string',
          example: 'attachment; filename="trainee-import-template.csv"',
        },
      },
    },
  })
  @Header('Content-Type', 'text/csv')
  @Header(
    'Content-Disposition',
    'attachment; filename="trainee-import-template.csv"',
  )
  async downloadCsvTemplate(): Promise<string> {
    return this.csvImportService.getCsvTemplate();
  }

  @Post('import-csv')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Import trainees from CSV file',
    description:
      'Import multiple trainees from a CSV file. Use the CSV template to ensure proper format.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file containing trainee data',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with trainee data',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'CSV import completed',
    type: CsvImportResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid CSV file or data format',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Coach or Admin access required',
  })
  @HttpCode(HttpStatus.CREATED)
  async importTraineesFromCsv(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<CsvImportResultDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.csvImportService.importTraineesFromCsv(file, coachId);
  }

  @Post('validate-csv')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Validate CSV file structure',
    description:
      'Validate the structure and data format of a CSV file before importing',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file to validate',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to validate',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV validation completed',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean', description: 'Whether the CSV is valid' },
        errors: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of validation errors',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file format',
  })
  @HttpCode(HttpStatus.OK)
  async validateCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    return this.csvImportService.validateCsvStructure(file);
  }

  @Get(':id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get detailed trainee information',
    description: 'Retrieve detailed information about a specific trainee',
  })
  @ApiParam({
    name: 'id',
    description: 'Trainee unique identifier',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trainee information retrieved successfully',
    type: TraineeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Trainee not found or not subscribed',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Coach or Admin access required',
  })
  async getTraineeById(
    @Param('id', ParseUUIDPipe) traineeId: string,
    @Req() req: Request,
  ): Promise<TraineeResponseDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.subscribedTraineesService.getTraineeById(traineeId, coachId);
  }

  @Get('stats/summary')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get trainee statistics summary',
    description: 'Get summary statistics for all subscribed trainees',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalTrainees: {
          type: 'number',
          description: 'Total number of subscribed trainees',
        },
        activeTrainees: {
          type: 'number',
          description: 'Number of active trainees',
        },
        averageProgress: {
          type: 'number',
          description: 'Average progress percentage',
        },
        newThisMonth: {
          type: 'number',
          description: 'New trainees this month',
        },
        byGoal: {
          type: 'object',
          description: 'Trainee count by fitness goal',
          additionalProperties: { type: 'number' },
        },
        byFitnessLevel: {
          type: 'object',
          description: 'Trainee count by fitness level',
          additionalProperties: { type: 'number' },
        },
      },
    },
  })
  async getTraineeStatistics(@Req() req: Request) {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;

    // Get all trainees with minimal filters for statistics
    const allTrainees =
      await this.subscribedTraineesService.getSubscribedTrainees(coachId, {
        page: 1,
        limit: 1000, // Get all for stats
      });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      totalTrainees: allTrainees.total,
      activeTrainees: allTrainees.trainees.filter(
        (t) => t.subscriptionStatus === 'active',
      ).length,
      averageProgress: Math.round(
        allTrainees.trainees.reduce(
          (sum, t) => sum + t.workoutCompletionPercentage,
          0,
        ) / (allTrainees.total || 1),
      ),
      newThisMonth: allTrainees.trainees.filter(
        (t) =>
          t.subscriptionStartDate &&
          new Date(t.subscriptionStartDate) >= startOfMonth,
      ).length,
      byGoal: this.groupByField(allTrainees.trainees, 'goal'),
      byFitnessLevel: this.groupByField(allTrainees.trainees, 'fitnessLevel'),
    };

    return stats;
  }

  /**
   * Helper method to group trainees by a specific field
   */
  private groupByField(
    trainees: TraineeResponseDto[],
    field: keyof TraineeResponseDto,
  ): Record<string, number> {
    return trainees.reduce(
      (acc, trainee) => {
        const value = (trainee[field] as string) || 'Unknown';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
