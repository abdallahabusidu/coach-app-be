import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { ClientService } from '../services/client.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { CreateClientProfileDto } from '../dtos/create-client-profile.dto';
import { UpdateClientProfileDto } from '../dtos/update-client-profile.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { OnboardingStep1ProfileDto } from '../dtos/onboarding-step1-profile.dto';
import { OnboardingStep2FitnessGoalsDto } from '../dtos/onboarding-step2-fitness-goals.dto';
import { OnboardingStep3DietaryDto } from '../dtos/onboarding-step3-dietary.dto';
import { OnboardingStep4HealthDto } from '../dtos/onboarding-step4-health.dto';
import { OnboardingStep5PreferencesDto } from '../dtos/onboarding-step5-preferences.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll() {
    const clients = await this.clientService.findAll();
    return { clients };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COACH)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const client = await this.clientService.findById(id);
    return { client };
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async createProfile(
    @CurrentUser() user,
    @Body() createClientProfileDto: CreateClientProfileDto,
  ) {
    const clientProfile = await this.clientService.create(
      user.id,
      createClientProfileDto,
    );
    return { clientProfile };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-profile')
  async getMyProfile(@CurrentUser() user) {
    try {
      const clientProfile = await this.clientService.findByUserId(user.id);
      return { clientProfile };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof BadRequestException
      ) {
        return { clientProfile: null };
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('my-profile')
  async updateMyProfile(
    @CurrentUser() user,
    @Body() updateClientProfileDto: UpdateClientProfileDto,
  ) {
    const clientProfile = await this.clientService.updateByUserId(
      user.id,
      updateClientProfileDto,
    );
    return { clientProfile };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.clientService.delete(id);
    return { message: 'Client profile deleted successfully' };
  }

  @ApiOperation({ summary: 'Step 1: Basic profile info' })
  @ApiResponse({ status: 200, description: 'Profile info updated' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: OnboardingStep1ProfileDto })
  @Patch('onboarding/profile')
  async onboardingProfile(
    @CurrentUser() user,
    @Body() dto: OnboardingStep1ProfileDto,
  ) {
    const clientProfile = await this.clientService.updateByUserId(user.id, dto);
    return { clientProfile };
  }

  @ApiOperation({ summary: 'Step 2: Fitness goals' })
  @ApiResponse({ status: 200, description: 'Fitness goals updated' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: OnboardingStep2FitnessGoalsDto })
  @Patch('onboarding/fitness-goals')
  async onboardingFitnessGoals(
    @CurrentUser() user,
    @Body() dto: OnboardingStep2FitnessGoalsDto,
  ) {
    const clientProfile = await this.clientService.updateByUserId(user.id, dto);
    return { clientProfile };
  }

  @ApiOperation({ summary: 'Step 3: Dietary habits' })
  @ApiResponse({ status: 200, description: 'Dietary habits updated' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: OnboardingStep3DietaryDto })
  @Patch('onboarding/dietary-habits')
  async onboardingDietaryHabits(
    @CurrentUser() user,
    @Body() dto: OnboardingStep3DietaryDto,
  ) {
    const clientProfile = await this.clientService.updateByUserId(user.id, dto);
    return { clientProfile };
  }

  @ApiOperation({ summary: 'Step 4: Health conditions' })
  @ApiResponse({ status: 200, description: 'Health conditions updated' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: OnboardingStep4HealthDto })
  @Patch('onboarding/health-conditions')
  async onboardingHealthConditions(
    @CurrentUser() user,
    @Body() dto: OnboardingStep4HealthDto,
  ) {
    const clientProfile = await this.clientService.updateByUserId(user.id, dto);
    return { clientProfile };
  }

  @ApiOperation({ summary: 'Step 5: Preferences & Logistics' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: OnboardingStep5PreferencesDto })
  @Patch('onboarding/preferences')
  async onboardingPreferences(
    @CurrentUser() user,
    @Body() dto: OnboardingStep5PreferencesDto,
  ) {
    const clientProfile = await this.clientService.updateByUserId(user.id, dto);
    return { clientProfile };
  }
}
