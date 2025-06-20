import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { PackageService } from '../services/package.service';
import { CreatePackageDto } from '../dtos/create-package.dto';
import { UpdatePackageDto } from '../dtos/update-package.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { FileUploadService } from '../../common/services/file-upload.service';

@ApiTags('Packages')
@Controller('packages')
export class PackageController {
  constructor(
    private readonly packageService: PackageService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @ApiOperation({ summary: 'Create a new package' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreatePackageDto })
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @CurrentUser() user,
    @UploadedFile() image: Express.Multer.File,
    @Body() dto: CreatePackageDto,
  ) {
    let imageUrl;
    if (image) {
      imageUrl = await this.fileUploadService.uploadPackageImage(image);
    }
    const pkg = await this.packageService.create(user.id, dto, imageUrl);
    return { package: pkg };
  }

  @ApiOperation({ summary: 'Get all packages for the current coach' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async findAllByCoach(@CurrentUser() user) {
    const packages = await this.packageService.findAllByCoach(user.id);
    return { packages };
  }

  @ApiOperation({ summary: 'Get a package by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(@Param('id') id: string) {
    const pkg = await this.packageService.findById(id);
    return { package: pkg };
  }

  @ApiOperation({ summary: 'Update a package' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdatePackageDto })
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() dto: UpdatePackageDto,
  ) {
    let imageUrl;
    if (image) {
      imageUrl = await this.fileUploadService.uploadPackageImage(image);
    }
    const pkg = await this.packageService.update(id, dto, imageUrl);
    return { package: pkg };
  }

  @ApiOperation({ summary: 'Delete a package' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.packageService.delete(id);
    return { message: 'Package deleted successfully' };
  }
}
