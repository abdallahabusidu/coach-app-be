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
  ParseUUIDPipe,
  HttpStatus,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { TemplateService } from '../services/template.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateResponseDto,
  TemplateListResponseDto,
} from '../dtos/template.dto';
import {
  AssignTemplateDto,
  UpdateTemplateAssignmentDto,
  UpdateAssignmentProgressDto,
  TemplateAssignmentResponseDto,
  TemplateAssignmentListResponseDto,
  TemplateRecommendationListResponseDto,
} from '../dtos/template-assignment.dto';
import {
  TemplateType,
  TemplateStatus,
  DifficultyLevel,
} from '../entities/template.entity';
import { AssignmentStatus } from '../entities/template-assignment.entity';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Create a new training template',
    description:
      'Create a comprehensive training template combining workouts and meals for each day',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template created successfully',
    type: TemplateResponseDto,
  })
  async createTemplate(
    @CurrentUser('id') coachId: string,
    @Body() createDto: CreateTemplateDto,
  ): Promise<TemplateResponseDto> {
    return this.templateService.createTemplate(coachId, createDto);
  }

  @Get()
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get coach templates with filtering',
    description:
      'Retrieve templates created by the coach with various filtering options',
  })
  @ApiQuery({ name: 'templateType', enum: TemplateType, required: false })
  @ApiQuery({ name: 'status', enum: TemplateStatus, required: false })
  @ApiQuery({ name: 'difficulty', enum: DifficultyLevel, required: false })
  @ApiQuery({ name: 'isPublic', type: Boolean, required: false })
  @ApiQuery({ name: 'tags', type: [String], required: false })
  @ApiQuery({ name: 'minRating', type: Number, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiQuery({
    name: 'sortBy',
    type: String,
    required: false,
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    enum: ['ASC', 'DESC'],
    required: false,
    example: 'DESC',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Templates retrieved successfully',
    type: TemplateListResponseDto,
  })
  async getTemplates(
    @CurrentUser('id') coachId: string,
    @Query('templateType') templateType?: TemplateType,
    @Query('status') status?: TemplateStatus,
    @Query('difficulty') difficulty?: DifficultyLevel,
    @Query('isPublic', ParseBoolPipe) isPublic?: boolean,
    @Query('tags') tags?: string[],
    @Query('minRating', ParseIntPipe) minRating?: number,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<TemplateListResponseDto> {
    return this.templateService.getTemplates(coachId, {
      templateType,
      status,
      difficulty,
      isPublic,
      tags: typeof tags === 'string' ? [tags] : tags,
      minRating,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get('public')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get public templates from all coaches',
    description: 'Browse public templates that can be used by any coach',
  })
  @ApiQuery({ name: 'templateType', enum: TemplateType, required: false })
  @ApiQuery({ name: 'difficulty', enum: DifficultyLevel, required: false })
  @ApiQuery({ name: 'tags', type: [String], required: false })
  @ApiQuery({ name: 'minRating', type: Number, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Public templates retrieved successfully',
    type: TemplateListResponseDto,
  })
  async getPublicTemplates(
    @CurrentUser('id') coachId: string,
    @Query('templateType') templateType?: TemplateType,
    @Query('difficulty') difficulty?: DifficultyLevel,
    @Query('tags') tags?: string[],
    @Query('minRating', ParseIntPipe) minRating?: number,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<TemplateListResponseDto> {
    return this.templateService.getTemplates(coachId, {
      templateType,
      difficulty,
      tags: typeof tags === 'string' ? [tags] : tags,
      minRating,
      page,
      limit,
      isPublic: true,
    });
  }

  @Get(':templateId')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get template by ID',
    description: 'Retrieve a specific template with complete details',
  })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template retrieved successfully',
    type: TemplateResponseDto,
  })
  async getTemplateById(
    @CurrentUser('id') coachId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ): Promise<TemplateResponseDto> {
    return this.templateService.getTemplateById(templateId, coachId);
  }

  @Put(':templateId')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Update template',
    description: 'Update template details, schedule, or settings',
  })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template updated successfully',
    type: TemplateResponseDto,
  })
  async updateTemplate(
    @CurrentUser('id') coachId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() updateDto: UpdateTemplateDto,
  ): Promise<TemplateResponseDto> {
    return this.templateService.updateTemplate(templateId, coachId, updateDto);
  }

  @Delete(':templateId')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Delete template',
    description: 'Delete a template (only if not assigned to any trainees)',
  })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Template deleted successfully',
  })
  async deleteTemplate(
    @CurrentUser('id') coachId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ): Promise<void> {
    return this.templateService.deleteTemplate(templateId, coachId);
  }

  @Post('assign')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Assign template to trainee',
    description:
      'Assign a training template to a trainee with optional customizations',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template assigned successfully',
    type: TemplateAssignmentResponseDto,
  })
  async assignTemplate(
    @CurrentUser('id') coachId: string,
    @Body() assignDto: AssignTemplateDto,
  ): Promise<TemplateAssignmentResponseDto> {
    return this.templateService.assignTemplate(coachId, assignDto);
  }

  @Get('assignments/list')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get template assignments',
    description: 'Retrieve all template assignments made by the coach',
  })
  @ApiQuery({ name: 'templateId', type: String, required: false })
  @ApiQuery({ name: 'traineeId', type: String, required: false })
  @ApiQuery({ name: 'status', enum: AssignmentStatus, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template assignments retrieved successfully',
    type: TemplateAssignmentListResponseDto,
  })
  async getTemplateAssignments(
    @CurrentUser('id') coachId: string,
    @Query('templateId') templateId?: string,
    @Query('traineeId') traineeId?: string,
    @Query('status') status?: AssignmentStatus,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<TemplateAssignmentListResponseDto> {
    return this.templateService.getTemplateAssignments(coachId, {
      templateId,
      traineeId,
      status,
      page,
      limit,
    });
  }

  @Put('assignments/:assignmentId/progress')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Update assignment progress',
    description: 'Update trainee progress on a template assignment',
  })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment progress updated successfully',
    type: TemplateAssignmentResponseDto,
  })
  async updateAssignmentProgress(
    @CurrentUser('id') coachId: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() progressDto: Omit<UpdateAssignmentProgressDto, 'assignmentId'>,
  ): Promise<TemplateAssignmentResponseDto> {
    return this.templateService.updateAssignmentProgress(coachId, {
      assignmentId,
      ...progressDto,
    });
  }

  @Get('recommendations/:traineeId')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get template recommendations for trainee',
    description:
      'Get AI-powered template recommendations based on trainee profile',
  })
  @ApiParam({ name: 'traineeId', description: 'Trainee ID' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template recommendations retrieved successfully',
    type: TemplateRecommendationListResponseDto,
  })
  async getTemplateRecommendations(
    @CurrentUser('id') coachId: string,
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<TemplateRecommendationListResponseDto> {
    return this.templateService.getTemplateRecommendations(
      coachId,
      traineeId,
      limit,
    );
  }
}
