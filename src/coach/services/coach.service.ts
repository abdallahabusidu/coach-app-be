import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoachProfileEntity } from '../entities/coach-profile.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import { CreateCoachProfileDto } from '../dtos/create-coach-profile.dto';
import { UpdateCoachProfileDto } from '../dtos/update-coach-profile.dto';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class CoachService {
  constructor(
    @InjectRepository(CoachProfileEntity)
    private readonly coachProfileRepository: Repository<CoachProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userService: UserService,
  ) {}

  async findAll(): Promise<CoachProfileEntity[]> {
    return this.coachProfileRepository.find({
      relations: ['user'],
      where: { user: { isActive: true } },
    });
  }

  async findById(id: string): Promise<CoachProfileEntity> {
    const profile = await this.coachProfileRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(`Coach profile with ID ${id} not found`);
    }

    return profile;
  }

  async findByUserId(userId: string): Promise<CoachProfileEntity> {
    const profile = await this.coachProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(
        `Coach profile for user ID ${userId} not found`,
      );
    }

    return profile;
  }

  async create(
    userId: string,
    createCoachProfileDto: CreateCoachProfileDto,
  ): Promise<CoachProfileEntity> {
    // Verify user exists and is a coach
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user is already a coach
    if (user.role !== UserRole.COACH) {
      // Update user role to coach
      user.role = UserRole.COACH;
      await this.userRepository.save(user);
    }

    // Check if profile already exists
    const existingProfile = await this.coachProfileRepository.findOne({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException(
        `Coach profile for user ID ${userId} already exists`,
      );
    }

    // Create new coach profile
    const coachProfile = this.coachProfileRepository.create({
      userId,
      ...createCoachProfileDto,
    });

    return this.coachProfileRepository.save(coachProfile);
  }

  async update(
    id: string,
    updateCoachProfileDto: UpdateCoachProfileDto,
  ): Promise<CoachProfileEntity> {
    const profile = await this.findById(id);

    const updatedProfile = this.coachProfileRepository.merge(
      profile,
      updateCoachProfileDto,
    );
    return this.coachProfileRepository.save(updatedProfile);
  }

  async updateByUserId(
    userId: string,
    updateCoachProfileDto: UpdateCoachProfileDto,
  ): Promise<CoachProfileEntity> {
    const profile = await this.findByUserId(userId);

    const updatedProfile = this.coachProfileRepository.merge(
      profile,
      updateCoachProfileDto,
    );
    return this.coachProfileRepository.save(updatedProfile);
  }

  async verifyCoach(id: string): Promise<CoachProfileEntity> {
    const profile = await this.findById(id);
    profile.isVerified = true;
    return this.coachProfileRepository.save(profile);
  }

  async updateAvailability(
    id: string,
    availableDays: string[],
    availableHours: any,
  ): Promise<CoachProfileEntity> {
    const profile = await this.findById(id);
    profile.availableDays = availableDays;
    profile.availableHours = availableHours;
    return this.coachProfileRepository.save(profile);
  }

  async findVerifiedCoaches(): Promise<CoachProfileEntity[]> {
    return this.coachProfileRepository.find({
      where: { isVerified: true },
      relations: ['user'],
      order: { rating: 'DESC' },
    });
  }

  async updateRating(id: string, rating: number): Promise<CoachProfileEntity> {
    const profile = await this.findById(id);

    // Calculate new average rating
    const newTotalRatings = profile.totalRatings + 1;
    const currentTotalPoints = profile.rating * profile.totalRatings;
    const newRating = (currentTotalPoints + rating) / newTotalRatings;

    // Update profile
    profile.rating = Number(newRating.toFixed(1));
    profile.totalRatings = newTotalRatings;

    return this.coachProfileRepository.save(profile);
  }

  async delete(id: string): Promise<void> {
    const profile = await this.findById(id);
    await this.coachProfileRepository.remove(profile);
  }

  async createProfile(
    userId: string,
    createCoachProfileDto: CreateCoachProfileDto,
  ): Promise<CoachProfileEntity> {
    // Check if user exists
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Create or update coach profile
    return this.create(userId, createCoachProfileDto);
  }
}
