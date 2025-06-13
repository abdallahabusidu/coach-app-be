import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findById(id);

    const updatedUser = this.userRepository.merge(user, updateUserDto);
    await this.userRepository.save(updatedUser);

    return updatedUser;
  }

  async findByRole(role: UserRole): Promise<UserEntity[]> {
    return this.userRepository.find({ where: { role } });
  }

  async findClients(): Promise<UserEntity[]> {
    return this.findByRole(UserRole.CLIENT);
  }

  async findCoaches(): Promise<UserEntity[]> {
    return this.findByRole(UserRole.COACH);
  }

  async deactivate(id: string): Promise<UserEntity> {
    const user = await this.findById(id);
    user.isActive = false;
    return this.userRepository.save(user);
  }

  async activate(id: string): Promise<UserEntity> {
    const user = await this.findById(id);
    user.isActive = true;
    return this.userRepository.save(user);
  }
  async create(userData: Partial<UserEntity>): Promise<UserEntity> {
    const newUser = this.userRepository.create(userData);
    return this.userRepository.save(newUser);
  }

  async createProfile(
    userId: string,
    profileData: Partial<UserEntity>,
  ): Promise<UserEntity> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedProfile = this.userRepository.merge(user, profileData);
    return this.userRepository.save(updatedProfile);
  }
}
