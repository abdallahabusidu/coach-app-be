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
  Req,
  ParseUUIDPipe,
  HttpStatus,
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
import { MealPlanService } from '../services/meal-plan.service';
import {
  CreateMealPlanDto,
  UpdateMealPlanDto,
  AssignMealPlanDto,
  MealPlanResponseDto,
  MealPlanListResponseDto,
} from '../dtos/meal-plan.dto';
import { MealPlanType, PlanStatus } from '../entities/meal-plan.entity';

@ApiTags('Meal Plans')
@Controller('meal-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MealPlanController {
  constructor(private readonly mealPlanService: MealPlanService) {}

  @Post()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new meal plan',
    description:
      'Create a comprehensive meal plan with daily schedules, nutrition targets, and dietary preferences.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Meal plan created successfully',
    type: MealPlanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - Coach role required',
  })
  async createMealPlan(
    @Body() createDto: CreateMealPlanDto,
    @Req() req: Request,
  ): Promise<MealPlanResponseDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.mealPlanService.createMealPlan(coachId, createDto);
  }

  @Get()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get meal plans with filtering and pagination',
    description:
      'Retrieve meal plans created by the coach with optional filtering by type, status, trainee, etc.',
  })
  @ApiQuery({
    name: 'planType',
    required: false,
    enum: MealPlanType,
    description: 'Filter by meal plan type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PlanStatus,
    description: 'Filter by plan status',
  })
  @ApiQuery({
    name: 'isTemplate',
    required: false,
    type: 'boolean',
    description: 'Filter by template status',
  })
  @ApiQuery({
    name: 'traineeId',
    required: false,
    type: 'string',
    description: 'Filter by assigned trainee',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Number of items per page',
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: 'string',
    description: 'Sort field',
    enum: ['name', 'createdAt', 'usageCount', 'averageRating'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: 'string',
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meal plans retrieved successfully',
    type: MealPlanListResponseDto,
  })
  async getMealPlans(
    @Req() req: Request,
    @Query('planType') planType?: MealPlanType,
    @Query('status') status?: PlanStatus,
    @Query('isTemplate') isTemplate?: boolean,
    @Query('traineeId') traineeId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<MealPlanListResponseDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.mealPlanService.getMealPlans(coachId, {
      planType,
      status,
      isTemplate,
      traineeId,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get(':planId')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get a specific meal plan',
    description: 'Retrieve detailed information about a specific meal plan.',
  })
  @ApiParam({
    name: 'planId',
    description: 'Unique identifier of the meal plan',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meal plan retrieved successfully',
    type: MealPlanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Meal plan not found',
  })
  async getMealPlanById(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Req() req: Request,
  ): Promise<MealPlanResponseDto> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    // For coaches, use their coach profile ID
    let coachId = userId;
    if (userRole === UserRole.COACH) {
      coachId = (req.user as any).coachProfile?.id || userId;
    }

    return this.mealPlanService.getMealPlanById(planId, coachId);
  }

  @Put(':planId')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a meal plan',
    description: 'Update an existing meal plan with new information.',
  })
  @ApiParam({
    name: 'planId',
    description: 'Unique identifier of the meal plan',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meal plan updated successfully',
    type: MealPlanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Meal plan not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateMealPlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() updateDto: UpdateMealPlanDto,
    @Req() req: Request,
  ): Promise<MealPlanResponseDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.mealPlanService.updateMealPlan(planId, coachId, updateDto);
  }

  @Delete(':planId')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a meal plan',
    description:
      'Delete a meal plan. Can only delete plans that are not currently assigned to trainees.',
  })
  @ApiParam({
    name: 'planId',
    description: 'Unique identifier of the meal plan',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meal plan deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Meal plan not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete a plan that is currently assigned',
  })
  async deleteMealPlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    await this.mealPlanService.deleteMealPlan(planId, coachId);
    return { message: 'Meal plan deleted successfully' };
  }

  @Post('assign')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Assign a meal plan to a trainee',
    description:
      'Assign an existing meal plan to a specific trainee with optional customizations.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Meal plan assigned successfully',
    type: MealPlanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Meal plan or trainee not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Trainee already has an active assignment for this plan',
  })
  async assignMealPlan(
    @Body() assignDto: AssignMealPlanDto,
    @Req() req: Request,
  ): Promise<MealPlanResponseDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.mealPlanService.assignMealPlan(coachId, assignDto);
  }

  @Get('trainee/:traineeId')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get meal plans assigned to a specific trainee',
    description:
      'Retrieve all active meal plans assigned to a specific trainee.',
  })
  @ApiParam({
    name: 'traineeId',
    description: 'Unique identifier of the trainee',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trainee meal plans retrieved successfully',
    type: MealPlanListResponseDto,
  })
  async getTraineeMealPlans(
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Req() req: Request,
  ): Promise<MealPlanListResponseDto> {
    const userRole = (req.user as any).role;
    const userId = (req.user as any).id;

    // If trainee is accessing their own plans
    if (userRole === UserRole.TRAINEE && userId === traineeId) {
      return this.mealPlanService.getTraineeMealPlans(traineeId);
    }

    // If coach is accessing trainee plans, filter by coach
    if (userRole === UserRole.COACH) {
      const coachId = (req.user as any).coachProfile?.id || userId;
      return this.mealPlanService.getTraineeMealPlans(traineeId, coachId);
    }

    // Admin can access all
    if (userRole === UserRole.ADMIN) {
      return this.mealPlanService.getTraineeMealPlans(traineeId);
    }

    throw new Error('Unauthorized access');
  }

  @Get('templates/public')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get public meal plan templates',
    description:
      'Retrieve public meal plan templates that can be used as starting points for new plans.',
  })
  @ApiQuery({
    name: 'planType',
    required: false,
    enum: MealPlanType,
    description: 'Filter by meal plan type',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Number of items per page',
    example: 20,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Public templates retrieved successfully',
    type: MealPlanListResponseDto,
  })
  async getPublicTemplates(
    @Req() req: Request,
    @Query('planType') planType?: MealPlanType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<MealPlanListResponseDto> {
    // This would be a separate method to get public templates
    // For now, we'll use the existing method with isTemplate filter
    const userId = (req.user as any).id;
    return this.mealPlanService.getMealPlans(userId, {
      planType,
      isTemplate: true,
      page,
      limit,
      sortBy: 'usageCount',
      sortOrder: 'DESC',
    });
  }

  @Get(':planId/shopping-list')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get shopping list for a meal plan',
    description:
      'Generate and retrieve the shopping list for a specific meal plan.',
  })
  @ApiParam({
    name: 'planId',
    description: 'Unique identifier of the meal plan',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shopping list retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        planId: { type: 'string' },
        planName: { type: 'string' },
        shoppingList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    quantity: { type: 'string' },
                    unit: { type: 'string' },
                    estimated_cost: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        totalEstimatedCost: { type: 'number' },
      },
    },
  })
  async getMealPlanShoppingList(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Req() req: Request,
  ): Promise<any> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    let coachId = userId;
    if (userRole === UserRole.COACH) {
      coachId = (req.user as any).coachProfile?.id || userId;
    }

    const plan = await this.mealPlanService.getMealPlanById(planId, coachId);

    const totalEstimatedCost =
      plan.shoppingList?.reduce((total, category) => {
        return (
          total +
          category.items.reduce((catTotal, item) => {
            return catTotal + (item.estimated_cost || 0);
          }, 0)
        );
      }, 0) || 0;

    return {
      planId: plan.id,
      planName: plan.name,
      shoppingList: plan.shoppingList || [],
      totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    };
  }
}
