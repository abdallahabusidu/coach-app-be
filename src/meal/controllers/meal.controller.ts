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
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MealService } from '../services/meal.service';
import { CreateMealDto } from '../dtos/create-meal.dto';
import { UpdateMealDto } from '../dtos/update-meal.dto';
import { MealQueryDto } from '../dtos/meal-query.dto';
import {
  MealResponseDto,
  PaginatedMealsResponseDto,
} from '../dtos/meal-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { MealType } from '../entities/meal.entity';
import {
  ApiCreateResponses,
  ApiCrudResponses,
  ApiUpdateResponses,
  ApiDeleteResponses,
  ApiPaginatedResponse,
  ApiAuthResponses,
} from '../../common/decorators/api-responses.decorator';

@ApiTags('Meals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('meals')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Create a new meal (Coach only)',
    description:
      'Create a new meal with nutritional information. Only coaches can create meals.',
  })
  @ApiCreateResponses('Meal', MealResponseDto)
  @ApiAuthResponses()
  async create(@Body() createMealDto: CreateMealDto): Promise<MealResponseDto> {
    return this.mealService.create(createMealDto);
  }

  @Get()
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Get all meals with filtering and pagination',
    description:
      'Retrieve a paginated list of meals with optional filtering by type, search, calories, and protein.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'mealType',
    enum: MealType,
    required: false,
    description: 'Filter by meal type',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or description',
  })
  @ApiQuery({
    name: 'maxCalories',
    required: false,
    description: 'Maximum calories',
  })
  @ApiQuery({
    name: 'minProtein',
    required: false,
    description: 'Minimum protein content',
  })
  @ApiPaginatedResponse(MealResponseDto, 'Meals retrieved successfully')
  @ApiAuthResponses()
  async findAll(
    @Query() queryDto: MealQueryDto,
  ): Promise<PaginatedMealsResponseDto> {
    return this.mealService.findAll(queryDto);
  }

  @Get('statistics')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get meal statistics (Coach only)',
    description:
      'Get statistical information about meals including totals by type and averages.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meal statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Only coaches can view meal statistics',
  })
  async getStatistics() {
    return this.mealService.getStatistics();
  }

  @Get('type/:mealType')
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Get meals by type',
    description:
      'Retrieve all meals of a specific type (breakfast, lunch, dinner, snacks, drinks).',
  })
  @ApiParam({
    name: 'mealType',
    enum: MealType,
    description: 'Type of meal to retrieve',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meals retrieved successfully',
    type: [MealResponseDto],
  })
  @ApiAuthResponses()
  async findByType(
    @Param('mealType') mealType: MealType,
  ): Promise<MealResponseDto[]> {
    return this.mealService.findByType(mealType);
  }

  @Get(':id')
  @Roles(UserRole.COACH, UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Get a meal by ID',
    description: 'Retrieve detailed information about a specific meal.',
  })
  @ApiParam({ name: 'id', description: 'Meal ID (UUID)' })
  @ApiCrudResponses('Meal', MealResponseDto)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MealResponseDto> {
    return this.mealService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Update a meal (Coach only)',
    description: 'Update an existing meal. Only coaches can update meals.',
  })
  @ApiParam({ name: 'id', description: 'Meal ID (UUID)' })
  @ApiUpdateResponses('Meal', MealResponseDto)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMealDto: UpdateMealDto,
  ): Promise<MealResponseDto> {
    return this.mealService.update(id, updateMealDto);
  }

  @Delete(':id')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Delete a meal (Coach only)',
    description: 'Delete an existing meal. Only coaches can delete meals.',
  })
  @ApiParam({ name: 'id', description: 'Meal ID (UUID)' })
  @ApiDeleteResponses('Meal')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.mealService.remove(id);
  }
}
