import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CoachService } from '../services/coach.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { CreateCoachProfileDto } from '../dtos/create-coach-profile.dto';
import { UpdateCoachProfileDto } from '../dtos/update-coach-profile.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('coaches')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get()
  async findAll() {
    const coaches = await this.coachService.findVerifiedCoaches();
    return { coaches };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const coach = await this.coachService.findById(id);
    return { coach };
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async createProfile(
    @CurrentUser() user,
    @Body() createCoachProfileDto: CreateCoachProfileDto,
  ) {
    const coachProfile = await this.coachService.create(
      user.id,
      createCoachProfileDto,
    );
    return { coachProfile };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-profile')
  async getMyProfile(@CurrentUser() user) {
    try {
      const coachProfile = await this.coachService.findByUserId(user.id);
      return { coachProfile };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof BadRequestException
      ) {
        return { coachProfile: null };
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('my-profile')
  async updateMyProfile(
    @CurrentUser() user,
    @Body() updateCoachProfileDto: UpdateCoachProfileDto,
  ) {
    const coachProfile = await this.coachService.updateByUserId(
      user.id,
      updateCoachProfileDto,
    );
    return { coachProfile };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/verify')
  async verifyCoach(@Param('id') id: string) {
    const coachProfile = await this.coachService.verifyCoach(id);
    return { coachProfile };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('my-profile/availability')
  async updateAvailability(
    @CurrentUser() user,
    @Body() data: { availableDays: string[]; availableHours: any },
  ) {
    const profile = await this.coachService.findByUserId(user.id);
    const coachProfile = await this.coachService.updateAvailability(
      profile.id,
      data.availableDays,
      data.availableHours,
    );
    return { coachProfile };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.coachService.delete(id);
    return { message: 'Coach profile deleted successfully' };
  }
}
