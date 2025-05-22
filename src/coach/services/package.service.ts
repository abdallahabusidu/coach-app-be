import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackageEntity } from '../entities/package.entity';
import { CreatePackageDto } from '../dtos/create-package.dto';
import { UpdatePackageDto } from '../dtos/update-package.dto';

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(PackageEntity)
    private readonly packageRepo: Repository<PackageEntity>,
  ) {}

  async create(coachId: string, dto: CreatePackageDto, imageUrl?: string) {
    const pkg = this.packageRepo.create({
      ...dto,
      imageUrl,
      coach: { id: coachId },
    });
    return this.packageRepo.save(pkg);
  }

  async findAllByCoach(coachId: string) {
    return this.packageRepo.find({ where: { coach: { id: coachId } } });
  }

  async findById(id: string) {
    const pkg = await this.packageRepo.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto, imageUrl?: string) {
    const pkg = await this.findById(id);
    Object.assign(pkg, dto);
    if (imageUrl) pkg.imageUrl = imageUrl;
    return this.packageRepo.save(pkg);
  }

  async delete(id: string) {
    const pkg = await this.findById(id);
    await this.packageRepo.remove(pkg);
    return true;
  }
}
