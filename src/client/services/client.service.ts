import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProfileEntity } from '../entities/client-profile.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import { CreateClientProfileDto } from '../dtos/create-client-profile.dto';
import { UpdateClientProfileDto } from '../dtos/update-client-profile.dto';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(ClientProfileEntity)
    private readonly clientProfileRepository: Repository<ClientProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userService: UserService,
  ) {}

  async findAll(): Promise<ClientProfileEntity[]> {
    return this.clientProfileRepository.find({
      relations: ['user'],
      where: { user: { isActive: true } },
    });
  }

  async findById(id: string): Promise<ClientProfileEntity> {
    const profile = await this.clientProfileRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(`Client profile with ID ${id} not found`);
    }

    return profile;
  }

  async findByUserId(userId: string): Promise<ClientProfileEntity> {
    const profile = await this.clientProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(
        `Client profile for user ID ${userId} not found`,
      );
    }

    return profile;
  }

  async create(
    userId: string,
    createClientProfileDto: CreateClientProfileDto,
  ): Promise<ClientProfileEntity> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user is already a client
    if (user.role !== UserRole.TRAINEE) {
      // Update user role to client
      user.role = UserRole.TRAINEE;
      await this.userRepository.save(user);
    }

    // Check if profile already exists
    const existingProfile = await this.clientProfileRepository.findOne({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException(
        `Client profile for user ID ${userId} already exists`,
      );
    }

    // Create new client profile
    const clientProfile = this.clientProfileRepository.create({
      userId,
      ...createClientProfileDto,
    });

    return this.clientProfileRepository.save(clientProfile);
  }

  async update(
    id: string,
    updateClientProfileDto: UpdateClientProfileDto,
  ): Promise<ClientProfileEntity> {
    const profile = await this.findById(id);

    const updatedProfile = this.clientProfileRepository.merge(
      profile,
      updateClientProfileDto,
    );
    return this.clientProfileRepository.save(updatedProfile);
  }

  async updateByUserId(
    userId: string,
    updateClientProfileDto: UpdateClientProfileDto,
  ): Promise<ClientProfileEntity> {
    const profile = await this.findByUserId(userId);

    const updatedProfile = this.clientProfileRepository.merge(
      profile,
      updateClientProfileDto,
    );
    return this.clientProfileRepository.save(updatedProfile);
  }

  async delete(id: string): Promise<void> {
    const profile = await this.findById(id);
    await this.clientProfileRepository.remove(profile);
  }
}
