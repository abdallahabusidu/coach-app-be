import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { AuthResponseDto, TokenResponseDto } from '../dtos/auth-response.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { RegisterDto } from '../dtos/register.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'User has been successfully registered',
    type: AuthResponseDto,
  })
  @ApiConflictResponse({
    description: 'User with this email or phone already exists',
  })
  @Public()
  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({
    description: 'User has been successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Login using guard-based authentication' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'User has been successfully authenticated through guard',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login-with-guard')
  @HttpCode(HttpStatus.OK)
  async loginWithGuard(@Request() req) {
    // The user is automatically validated via LocalStrategy and attached to req
    return await this.authService.generateAuthResponse(req.user);
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiOkResponse({
    description: 'Tokens have been successfully refreshed',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }
}
