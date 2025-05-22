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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CoachService } from '../services/coach.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { CreateCoachProfileDto } from '../dtos/create-coach-profile.dto';
import { UpdateCoachProfileDto } from '../dtos/update-coach-profile.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../../common/services/file-upload.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FitnessArea, Gender } from '../entities/coach-profile.entity';
import { BioDto } from '../dtos/onboarding/bio.dto';
import { FitnessAreasDto } from '../dtos/onboarding/fitness-areas.dto';
import { PersonalInfoDto } from '../dtos/onboarding/personal-info.dto';
import { CertificatesUploadDto } from '../dtos/onboarding/certificates-upload.dto';
import { OnboardingStatusResponseDto } from '../dtos/onboarding/onboarding-status-response.dto';

@ApiTags('coaches')
@Controller('coaches')
export class CoachController {
  constructor(
    private readonly coachService: CoachService,
    private readonly fileUploadService: FileUploadService,
  ) {}

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

  // Onboarding specific endpoints
  @ApiOperation({ summary: 'Start coach onboarding process' })
  @ApiResponse({
    status: 201,
    description: 'Coach profile initialized for onboarding',
    schema: { example: { coachProfile: {} } },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('onboarding/start')
  async startOnboarding(@CurrentUser() user) {
    // Initialize an empty profile or return existing one
    let coachProfile;
    try {
      coachProfile = await this.coachService.findByUserId(user.id);
    } catch (error) {
      // If no profile exists, create a base one
      coachProfile = await this.coachService.create(user.id, {
        bio: '',
        specialization: '',
        yearsOfExperience: 0,
        certificates: [],
        gender: Gender.PREFER_NOT_TO_SAY,
        age: 0,
        location: '',
        hourlyRate: 0,
        profilePictureUrl: '',
        fitnessAreas: [],
      });
    }

    return { coachProfile };
  }

  @ApiOperation({ summary: 'Update coach profile bio during onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Bio updated successfully',
    schema: { example: { coachProfile: {} } },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: BioDto })
  @Patch('onboarding/bio')
  async updateBio(@CurrentUser() user, @Body() data: BioDto) {
    const coachProfile = await this.coachService.updateByUserId(user.id, {
      bio: data.bio,
    });
    return { coachProfile };
  }

  @ApiOperation({ summary: 'Update coach fitness areas during onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Fitness areas updated successfully',
    schema: { example: { coachProfile: {} } },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: FitnessAreasDto })
  @Patch('onboarding/fitness-areas')
  async updateFitnessAreas(@CurrentUser() user, @Body() data: FitnessAreasDto) {
    // Convert string[] to FitnessArea[]
    const fitnessAreas = data.fitnessAreas.map((area) => area as FitnessArea);
    const coachProfile = await this.coachService.updateByUserId(user.id, {
      fitnessAreas,
    });
    return { coachProfile };
  }

  @ApiOperation({ summary: 'Update coach profile picture during onboarding' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture updated successfully',
    schema: { example: { coachProfile: {} } },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('onboarding/profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  async updateProfilePicture(
    @CurrentUser() user,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileUrl = await this.fileUploadService.uploadProfilePicture(file);

    // Get current profile
    const profile = await this.coachService.findByUserId(user.id);

    // Delete old profile picture if it exists
    if (profile.profilePictureUrl) {
      await this.fileUploadService.deleteFile(profile.profilePictureUrl);
    }

    // Update with new URL
    const coachProfile = await this.coachService.updateByUserId(user.id, {
      profilePictureUrl: fileUrl,
    });

    return { coachProfile };
  }

  @ApiOperation({ summary: 'Upload coach certificates during onboarding' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Upload certificate files and their metadata. certificatesInfo should be a JSON string array matching the files order.',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Certificate files',
        },
        certificatesInfo: {
          type: 'string',
          description: 'JSON string of certificate details (array of objects)',
        },
      },
      required: ['files', 'certificatesInfo'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Certificates uploaded successfully',
    schema: { example: { coachProfile: {} } },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('onboarding/certificates')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadCertificates(
    @CurrentUser() user,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('certificatesInfo') certificatesInfoJson: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    let certificatesInfo;
    try {
      certificatesInfo = JSON.parse(certificatesInfoJson);
    } catch (error) {
      throw new BadRequestException('Invalid certificates info format');
    }

    // Upload each file and create certificate entries
    const certificates = [];
    for (let i = 0; i < files.length; i++) {
      const fileUrl = await this.fileUploadService.uploadCertificate(files[i]);
      certificates.push({
        ...certificatesInfo[i],
        url: fileUrl,
      });
    }

    // Get current profile and update certificates
    const profile = await this.coachService.findByUserId(user.id);
    const existingCerts = profile.certificates || [];

    const coachProfile = await this.coachService.updateByUserId(user.id, {
      certificates: [...existingCerts, ...certificates],
    });

    return { coachProfile };
  }

  @ApiOperation({ summary: 'Update coach personal info during onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Personal information updated successfully',
    schema: { example: { coachProfile: {} } },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: PersonalInfoDto })
  @Patch('onboarding/personal-info')
  async updatePersonalInfo(@CurrentUser() user, @Body() data: PersonalInfoDto) {
    const coachProfile = await this.coachService.updateByUserId(user.id, {
      ...data,
      gender: data.gender as Gender,
    });
    return { coachProfile };
  }

  @ApiOperation({ summary: 'Complete coach onboarding process' })
  @ApiResponse({
    status: 200,
    description: 'Coach onboarding completed successfully',
    schema: {
      example: {
        message: 'Coach onboarding completed successfully',
        coachProfile: {},
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('onboarding/complete')
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(@CurrentUser() user) {
    // Get current profile to validate all required fields are filled
    const profile = await this.coachService.findByUserId(user.id);

    // Check if required fields are filled
    const requiredFields = [
      'bio',
      'gender',
      'age',
      'location',
      'profilePictureUrl',
    ];
    const missingFields = requiredFields.filter((field) => !profile[field]);

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Onboarding incomplete. Missing fields: ${missingFields.join(', ')}`,
      );
    }

    // Mark as complete by setting additional flag or similar
    const coachProfile = await this.coachService.updateByUserId(user.id, {
      onboardingCompleted: true,
    });

    return {
      message: 'Coach onboarding completed successfully',
      coachProfile,
    };
  }

  @ApiOperation({ summary: 'Get onboarding status and completion percentage' })
  @ApiResponse({
    status: 200,
    description: 'Returns onboarding completion status',
    type: OnboardingStatusResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('onboarding/status')
  async getOnboardingStatus(@CurrentUser() user) {
    // Get current profile to check onboarding status
    const profile = await this.coachService.findByUserId(user.id);

    // Calculate completion percentage based on filled fields
    const requiredFields = [
      'bio',
      'gender',
      'age',
      'location',
      'profilePictureUrl',
      'fitnessAreas',
    ];
    let completedFields = 0;

    requiredFields.forEach((field) => {
      if (profile[field]) {
        if (Array.isArray(profile[field]) && profile[field].length > 0) {
          completedFields++;
        } else if (!Array.isArray(profile[field])) {
          completedFields++;
        }
      }
    });

    // Add certificate check
    if (profile.certificates && profile.certificates.length > 0) {
      completedFields++;
      requiredFields.push('certificates');
    }

    const completionPercentage = Math.floor(
      (completedFields / requiredFields.length) * 100,
    );

    return {
      completionPercentage,
      completedFields,
      totalFields: requiredFields.length,
      isComplete: profile.onboardingCompleted || false,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.coachService.delete(id);
    return { message: 'Coach profile deleted successfully' };
  }
}
