import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { ProductService } from '../services/product.service';
import { ProductType, ProductStatus } from '../entities/product.entity';
import {
  CreateProductDto,
  ProductResponseDto,
  ProductListResponseDto,
} from '../dtos/payment.dto';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({
    summary: 'Get products',
    description: 'Get paginated list of products with filtering',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully',
    type: ProductListResponseDto,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ProductType,
    description: 'Filter by product type',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in name and description',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price filter',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price filter',
  })
  @ApiQuery({
    name: 'categories',
    required: false,
    type: [String],
    description: 'Filter by categories',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'price', 'salesCount', 'rating', 'createdAt'],
    description: 'Sort by field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async getProducts(
    @Query('type') type?: ProductType,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('categories') categories?: string[],
    @Query('sortBy')
    sortBy?: 'name' | 'price' | 'salesCount' | 'rating' | 'createdAt',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ProductListResponseDto> {
    return this.productService.getProducts({
      type,
      search,
      minPrice,
      maxPrice,
      categories: categories
        ? Array.isArray(categories)
          ? categories
          : [categories]
        : undefined,
      sortBy,
      sortOrder,
      page,
      limit,
    });
  }

  @Get('store/:platform')
  @ApiOperation({
    summary: 'Get store-compliant products',
    description: 'Get products available for specific app store platform',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Store products retrieved successfully',
    type: ProductListResponseDto,
  })
  @ApiParam({
    name: 'platform',
    enum: ['ios', 'android'],
    description: 'App store platform',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ProductType,
    description: 'Filter by product type',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async getStoreProducts(
    @Param('platform') platform: 'ios' | 'android',
    @Query('type') type?: ProductType,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ProductListResponseDto> {
    if (!['ios', 'android'].includes(platform)) {
      throw new BadRequestException('Invalid platform. Must be ios or android');
    }

    return this.productService.getStoreProducts(platform, {
      type,
      search,
      page,
      limit,
    });
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Get featured products',
    description: 'Get list of featured/popular products',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Featured products retrieved successfully',
    type: ProductListResponseDto,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ProductType,
    description: 'Filter by product type',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products to return',
  })
  async getFeaturedProducts(
    @Query('type') type?: ProductType,
    @Query('limit') limit?: number,
  ): Promise<ProductListResponseDto> {
    return this.productService.getFeaturedProducts({ type, limit });
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Get product categories',
    description: 'Get list of all available product categories',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getProductCategories(): Promise<{ categories: string[] }> {
    const categories = await this.productService.getProductCategories();
    return { categories };
  }

  @Get('types/:type')
  @ApiOperation({
    summary: 'Get products by type',
    description: 'Get products filtered by specific type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products by type retrieved successfully',
    type: ProductListResponseDto,
  })
  @ApiParam({ name: 'type', enum: ProductType, description: 'Product type' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async getProductsByType(
    @Param('type') type: ProductType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ProductListResponseDto> {
    return this.productService.getProductsByType(type, { page, limit });
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search products',
    description: 'Search products by name and description',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
    type: ProductListResponseDto,
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ProductType,
    description: 'Filter by product type',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async searchProducts(
    @Query('q') query: string,
    @Query('type') type?: ProductType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ProductListResponseDto> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException(
        'Search query must be at least 2 characters long',
      );
    }

    return this.productService.searchProducts(query.trim(), {
      type,
      page,
      limit,
    });
  }

  @Get(':productId')
  @ApiOperation({
    summary: 'Get product details',
    description: 'Get detailed information about a specific product',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product details retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  async getProduct(
    @Param('productId') productId: string,
  ): Promise<ProductResponseDto> {
    return this.productService.getProduct(productId);
  }

  // Admin-only endpoints
  @Post()
  @ApiOperation({
    summary: 'Create product (Admin only)',
    description: 'Create a new product',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid product data',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.createProduct(createProductDto);
  }

  @Put(':productId')
  @ApiOperation({
    summary: 'Update product (Admin only)',
    description: 'Update an existing product',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async updateProduct(
    @Param('productId') productId: string,
    @Body() updateProductDto: Partial<CreateProductDto>,
  ): Promise<ProductResponseDto> {
    return this.productService.updateProduct(productId, updateProductDto);
  }

  @Put(':productId/activate')
  @ApiOperation({
    summary: 'Activate product (Admin only)',
    description: 'Activate a product to make it available for purchase',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product activated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async activateProduct(
    @Param('productId') productId: string,
  ): Promise<ProductResponseDto> {
    return this.productService.activateProduct(productId);
  }

  @Put(':productId/deactivate')
  @ApiOperation({
    summary: 'Deactivate product (Admin only)',
    description: 'Deactivate a product to remove it from sale',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product deactivated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async deactivateProduct(
    @Param('productId') productId: string,
  ): Promise<ProductResponseDto> {
    return this.productService.deactivateProduct(productId);
  }

  @Delete(':productId')
  @ApiOperation({
    summary: 'Delete product (Admin only)',
    description: 'Delete a product (archives if it has sales)',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async deleteProduct(@Param('productId') productId: string): Promise<void> {
    await this.productService.deleteProduct(productId);
  }

  @Get('admin/all')
  @ApiOperation({
    summary: 'Get all products (Admin only)',
    description:
      'Get all products including inactive ones for admin management',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All products retrieved successfully',
    type: ProductListResponseDto,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProductStatus,
    description: 'Filter by product status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ProductType,
    description: 'Filter by product type',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async getAllProducts(
    @Query('status') status?: ProductStatus,
    @Query('type') type?: ProductType,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ProductListResponseDto> {
    return this.productService.getProducts({
      status,
      type,
      search,
      page,
      limit,
    });
  }

  @Post(':productId/stats')
  @ApiOperation({
    summary: 'Update product stats (Internal use)',
    description:
      'Update product sales count and rating - typically called by payment system',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product stats updated successfully',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async updateProductStats(
    @Param('productId') productId: string,
    @Body()
    stats: {
      salesIncrement?: number;
      newRating?: number;
    },
  ): Promise<{ success: boolean; message: string }> {
    await this.productService.updateProductStats(productId, stats);

    return {
      success: true,
      message: 'Product stats updated successfully',
    };
  }
}
