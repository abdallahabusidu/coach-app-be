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
} from '@nestjs/common';
import { ClientService } from '../services/client.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { CreateClientProfileDto } from '../dtos/create-client-profile.dto';
import { UpdateClientProfileDto } from '../dtos/update-client-profile.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

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
}
