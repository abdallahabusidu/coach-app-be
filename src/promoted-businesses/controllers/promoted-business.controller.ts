import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { PromotedBusinessService } from '../services/promoted-business.service';
import {
  CreatePromotedBusinessDto,
  UpdatePromotedBusinessDto,
  GetPromotedBusinessesDto,
  CreateInteractionDto,
  PromotedBusinessResponseDto,
  HomePageBusinessesResponseDto,
} from '../dtos/promoted-business.dto';
import { PromotedBusinessEntity } from '../entities/promoted-business.entity';
import { BusinessUserInteractionEntity } from '../entities/business-user-interaction.entity';

@ApiTags('Promoted Businesses')
@Controller('promoted-businesses')
export class PromotedBusinessController {
  constructor(
    private readonly promotedBusinessService: PromotedBusinessService,
  ) {}

  // Public Endpoints (No Auth Required)

  @Get('home-page')
  @ApiOperation({
    summary: 'Get promoted businesses for home page',
    description:
      'Returns featured gyms and nutrition restaurants for the trainee home page',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Home page businesses retrieved successfully',
    type: HomePageBusinessesResponseDto,
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    description: 'User latitude for distance calculation',
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'User longitude for distance calculation',
  })
  async getHomePageBusinesses(
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Req() request?: Request,
  ): Promise<HomePageBusinessesResponseDto> {
    // Extract user ID from token if available (optional authentication)
    let userId: string | undefined;
    try {
      const user = request?.user as any;
      userId = user?.sub || user?.id;
    } catch (error) {
      // No authentication provided, continue without user tracking
    }

    return await this.promotedBusinessService.getHomePageBusinesses(
      userId,
      latitude,
      longitude,
    );
  }

  @Get('public')
  @ApiOperation({
    summary: 'Get all active promoted businesses (public)',
    description:
      'Returns all active promoted businesses without authentication required',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Businesses retrieved successfully',
  })
  async getPublicBusinesses(@Query() query: GetPromotedBusinessesDto): Promise<{
    businesses: PromotedBusinessResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Force active only for public endpoint
    query.activeOnly = true;
    return await this.promotedBusinessService.getBusinesses(query);
  }

  @Get('public/:id')
  @ApiOperation({
    summary: 'Get single promoted business by ID (public)',
    description: 'Returns a single promoted business details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business retrieved successfully',
    type: PromotedBusinessResponseDto,
  })
  async getPublicBusiness(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PromotedBusinessEntity> {
    return await this.promotedBusinessService.findBusinessById(id);
  }

  // User Endpoints (Authentication Required)

  @Post('interactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Track user interaction with promoted business',
    description: 'Records user interactions like views, clicks, calls, etc.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Interaction recorded successfully',
  })
  async createInteraction(
    @Body() createInteractionDto: CreateInteractionDto,
    @Req() request: Request,
  ): Promise<BusinessUserInteractionEntity> {
    const user = request.user as any;
    const userId = user.sub || user.id;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    return await this.promotedBusinessService.createInteraction(
      createInteractionDto,
      userId,
      ipAddress,
      userAgent,
    );
  }

  @Get('my-interactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user's interactions with promoted businesses",
    description: "Returns the current user's interaction history",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Interactions retrieved successfully',
  })
  @ApiQuery({
    name: 'businessId',
    required: false,
    description: 'Filter by specific business',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit number of results',
  })
  async getMyInteractions(
    @Req() request: Request,
    @Query('businessId') businessId?: string,
    @Query('limit') limit: number = 50,
  ): Promise<BusinessUserInteractionEntity[]> {
    const user = request.user as any;
    const userId = user.sub || user.id;

    if (businessId) {
      return await this.promotedBusinessService.getBusinessInteractions(
        businessId,
        undefined,
        limit,
      );
    }

    // Get all user interactions across all businesses
    // This would require a new method in the service
    return [];
  }

  // Admin Endpoints (Admin Role Required)

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new promoted business',
    description: 'Creates a new promoted business (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Business created successfully',
    type: PromotedBusinessEntity,
  })
  async createBusiness(
    @Body() createBusinessDto: CreatePromotedBusinessDto,
  ): Promise<PromotedBusinessEntity> {
    return await this.promotedBusinessService.createBusiness(createBusinessDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all promoted businesses (Admin)',
    description:
      'Returns all promoted businesses including inactive ones (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Businesses retrieved successfully',
  })
  async getAllBusinesses(@Query() query: GetPromotedBusinessesDto): Promise<{
    businesses: PromotedBusinessResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Allow viewing inactive businesses for admin
    return await this.promotedBusinessService.getBusinesses(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get promoted business by ID (Admin)',
    description:
      'Returns a single promoted business with all details (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business retrieved successfully',
    type: PromotedBusinessEntity,
  })
  async getBusiness(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PromotedBusinessEntity> {
    return await this.promotedBusinessService.findBusinessById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update promoted business',
    description: 'Updates a promoted business (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business updated successfully',
    type: PromotedBusinessEntity,
  })
  async updateBusiness(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBusinessDto: UpdatePromotedBusinessDto,
  ): Promise<PromotedBusinessEntity> {
    return await this.promotedBusinessService.updateBusiness(
      id,
      updateBusinessDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete promoted business',
    description: 'Deletes a promoted business (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business deleted successfully',
  })
  async deleteBusiness(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.promotedBusinessService.deleteBusiness(id);
    return { message: 'Business deleted successfully' };
  }

  // Business Status Management

  @Put(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Activate promoted business',
    description: 'Activates a promoted business (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business activated successfully',
    type: PromotedBusinessEntity,
  })
  async activateBusiness(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PromotedBusinessEntity> {
    return await this.promotedBusinessService.activateBusiness(id);
  }

  @Put(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Suspend promoted business',
    description: 'Suspends a promoted business (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business suspended successfully',
    type: PromotedBusinessEntity,
  })
  async suspendBusiness(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PromotedBusinessEntity> {
    return await this.promotedBusinessService.suspendBusiness(id);
  }

  @Put(':id/expire')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Expire promoted business',
    description: 'Marks a promoted business as expired (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business expired successfully',
    type: PromotedBusinessEntity,
  })
  async expireBusiness(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PromotedBusinessEntity> {
    return await this.promotedBusinessService.expireBusiness(id);
  }

  // Contract Management

  @Put(':id/renew-contract')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Renew business contract',
    description: 'Renews a business contract with new end date (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contract renewed successfully',
    type: PromotedBusinessEntity,
  })
  async renewContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newEndDate') newEndDate: string,
  ): Promise<PromotedBusinessEntity> {
    return await this.promotedBusinessService.renewContract(
      id,
      new Date(newEndDate),
    );
  }

  @Get('admin/expiring-contracts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get expiring contracts',
    description: 'Returns businesses with contracts expiring soon (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expiring contracts retrieved successfully',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to look ahead (default: 30)',
  })
  async getExpiringContracts(
    @Query('days') days: number = 30,
  ): Promise<PromotedBusinessEntity[]> {
    return await this.promotedBusinessService.getExpiringContracts(days);
  }

  // Analytics Endpoints

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get business analytics',
    description: 'Returns detailed analytics for a business (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze (default: 30)',
  })
  async getBusinessAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('days') days: number = 30,
  ): Promise<any> {
    return await this.promotedBusinessService.getBusinessAnalytics(id, days);
  }

  @Get(':id/interactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get business interactions',
    description: 'Returns interaction history for a business (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Interactions retrieved successfully',
  })
  @ApiQuery({
    name: 'interactionType',
    required: false,
    description: 'Filter by interaction type',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit number of results',
  })
  async getBusinessInteractions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('interactionType') interactionType?: string,
    @Query('limit') limit: number = 100,
  ): Promise<BusinessUserInteractionEntity[]> {
    return await this.promotedBusinessService.getBusinessInteractions(
      id,
      interactionType as any,
      limit,
    );
  }
}
