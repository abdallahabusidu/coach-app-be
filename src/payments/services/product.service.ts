import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import {
  ProductEntity,
  ProductType,
  ProductStatus,
} from '../entities/product.entity';
import { PaymentMethod } from '../entities/payment.entity';
import {
  CreateProductDto,
  ProductResponseDto,
  ProductListResponseDto,
} from '../dtos/payment.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  /**
   * Create a new product
   */
  async createProduct(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    // Validate product data
    if (
      createProductDto.salePrice &&
      createProductDto.salePrice >= createProductDto.basePrice
    ) {
      throw new BadRequestException('Sale price must be less than base price');
    }

    // Check for duplicate Apple/Google product IDs
    if (createProductDto.appleProductId) {
      const existingApple = await this.productRepository.findOne({
        where: { appleProductId: createProductDto.appleProductId },
      });
      if (existingApple) {
        throw new BadRequestException('Apple product ID already exists');
      }
    }

    if (createProductDto.googleProductId) {
      const existingGoogle = await this.productRepository.findOne({
        where: { googleProductId: createProductDto.googleProductId },
      });
      if (existingGoogle) {
        throw new BadRequestException('Google product ID already exists');
      }
    }

    // Create product
    const product = new ProductEntity();
    product.name = createProductDto.name;
    product.description = createProductDto.description;
    product.type = createProductDto.type;
    product.status = ProductStatus.DRAFT;
    product.basePrice = createProductDto.basePrice;
    product.currency = createProductDto.currency;
    product.salePrice = createProductDto.salePrice;
    product.subscriptionPlan = createProductDto.subscriptionPlan;
    product.billingCycle = createProductDto.billingCycle;
    product.trialDays = createProductDto.trialDays;
    product.appleProductId = createProductDto.appleProductId;
    product.googleProductId = createProductDto.googleProductId;
    product.isStoreCompliant = createProductDto.isStoreCompliant ?? true;
    product.allowedPaymentMethods = createProductDto.allowedPaymentMethods || [
      PaymentMethod.APPLE_IAP,
      PaymentMethod.GOOGLE_PLAY,
    ];
    product.features = createProductDto.features;
    product.coachRevenueShare = createProductDto.coachRevenueShare ?? 70.0;
    product.platformFee = 100 - (createProductDto.coachRevenueShare ?? 70.0);

    const savedProduct = await this.productRepository.save(product);

    this.logger.log(`Product created: ${savedProduct.id}`);
    return this.transformProductToDto(savedProduct);
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    productId: string,
    updateProductDto: Partial<CreateProductDto>,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate sale price
    if (updateProductDto.salePrice && updateProductDto.basePrice) {
      if (updateProductDto.salePrice >= updateProductDto.basePrice) {
        throw new BadRequestException(
          'Sale price must be less than base price',
        );
      }
    }

    // Update product fields
    Object.assign(product, updateProductDto);

    // Recalculate platform fee if coach revenue share changed
    if (updateProductDto.coachRevenueShare !== undefined) {
      product.platformFee = 100 - updateProductDto.coachRevenueShare;
    }

    const savedProduct = await this.productRepository.save(product);

    this.logger.log(`Product updated: ${productId}`);
    return this.transformProductToDto(savedProduct);
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.transformProductToDto(product);
  }

  /**
   * Get products with filtering and pagination
   */
  async getProducts(
    filters: {
      type?: ProductType;
      status?: ProductStatus;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      isStoreCompliant?: boolean;
      categories?: string[];
      targetAudience?: string[];
      sortBy?: 'name' | 'price' | 'salesCount' | 'rating' | 'createdAt';
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    } = {},
  ): Promise<ProductListResponseDto> {
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // Apply filters
    if (filters.type) {
      queryBuilder.andWhere('product.type = :type', { type: filters.type });
    }

    if (filters.status) {
      queryBuilder.andWhere('product.status = :status', {
        status: filters.status,
      });
    } else {
      // Default to active products only
      queryBuilder.andWhere('product.status = :status', {
        status: ProductStatus.ACTIVE,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.minPrice !== undefined) {
      queryBuilder.andWhere('product.basePrice >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters.maxPrice !== undefined) {
      queryBuilder.andWhere('product.basePrice <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters.isStoreCompliant !== undefined) {
      queryBuilder.andWhere('product.isStoreCompliant = :isStoreCompliant', {
        isStoreCompliant: filters.isStoreCompliant,
      });
    }

    if (filters.categories && filters.categories.length > 0) {
      queryBuilder.andWhere('product.categories && :categories', {
        categories: filters.categories,
      });
    }

    if (filters.targetAudience && filters.targetAudience.length > 0) {
      queryBuilder.andWhere('product.targetAudience && :targetAudience', {
        targetAudience: filters.targetAudience,
      });
    }

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`product.${sortBy}`, sortOrder);

    // Apply pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    const products = await queryBuilder.getMany();

    const productDtos = products.map((product) =>
      this.transformProductToDto(product),
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      products: productDtos,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Get store-compliant products for app stores
   */
  async getStoreProducts(
    platform: 'ios' | 'android',
    filters: {
      type?: ProductType;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<ProductListResponseDto> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.isStoreCompliant = :isStoreCompliant', {
        isStoreCompliant: true,
      });

    // Platform-specific filtering
    if (platform === 'ios') {
      queryBuilder.andWhere('product.appleProductId IS NOT NULL');
      queryBuilder.andWhere(
        ':paymentMethod = ANY(product.allowedPaymentMethods)',
        { paymentMethod: PaymentMethod.APPLE_IAP },
      );
    } else if (platform === 'android') {
      queryBuilder.andWhere('product.googleProductId IS NOT NULL');
      queryBuilder.andWhere(
        ':paymentMethod = ANY(product.allowedPaymentMethods)',
        { paymentMethod: PaymentMethod.GOOGLE_PLAY },
      );
    }

    // Apply additional filters
    if (filters.type) {
      queryBuilder.andWhere('product.type = :type', { type: filters.type });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);
    const offset = (page - 1) * limit;

    queryBuilder
      .orderBy('product.salesCount', 'DESC')
      .addOrderBy('product.averageRating', 'DESC')
      .skip(offset)
      .take(limit);

    const products = await queryBuilder.getMany();

    const productDtos = products.map((product) =>
      this.transformProductToDto(product),
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      products: productDtos,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Get products by type
   */
  async getProductsByType(
    type: ProductType,
    filters: {
      page?: number;
      limit?: number;
    } = {},
  ): Promise<ProductListResponseDto> {
    return this.getProducts({
      type,
      status: ProductStatus.ACTIVE,
      ...filters,
    });
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(
    filters: {
      type?: ProductType;
      limit?: number;
    } = {},
  ): Promise<ProductListResponseDto> {
    return this.getProducts({
      type: filters.type,
      status: ProductStatus.ACTIVE,
      sortBy: 'salesCount',
      sortOrder: 'DESC',
      limit: filters.limit || 10,
      page: 1,
    });
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    filters: {
      type?: ProductType;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<ProductListResponseDto> {
    return this.getProducts({
      search: query,
      type: filters.type,
      status: ProductStatus.ACTIVE,
      page: filters.page,
      limit: filters.limit,
    });
  }

  /**
   * Activate a product
   */
  async activateProduct(productId: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.status = ProductStatus.ACTIVE;
    product.launchDate = new Date();

    const savedProduct = await this.productRepository.save(product);

    this.logger.log(`Product activated: ${productId}`);
    return this.transformProductToDto(savedProduct);
  }

  /**
   * Deactivate a product
   */
  async deactivateProduct(productId: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.status = ProductStatus.INACTIVE;

    const savedProduct = await this.productRepository.save(product);

    this.logger.log(`Product deactivated: ${productId}`);
    return this.transformProductToDto(savedProduct);
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Archive instead of delete if it has sales
    if (product.salesCount > 0) {
      product.status = ProductStatus.ARCHIVED;
      await this.productRepository.save(product);
      this.logger.log(`Product archived: ${productId}`);
    } else {
      await this.productRepository.remove(product);
      this.logger.log(`Product deleted: ${productId}`);
    }
  }

  /**
   * Update product sales count and rating
   */
  async updateProductStats(
    productId: string,
    stats: {
      salesIncrement?: number;
      newRating?: number;
    },
  ): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (stats.salesIncrement) {
      product.salesCount += stats.salesIncrement;
    }

    if (stats.newRating !== undefined) {
      // Calculate new average rating
      const totalRating =
        product.averageRating * product.reviewCount + stats.newRating;
      product.reviewCount += 1;
      product.averageRating = totalRating / product.reviewCount;
    }

    await this.productRepository.save(product);
  }

  /**
   * Get product categories
   */
  async getProductCategories(): Promise<string[]> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT unnest(product.categories)', 'category')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.categories IS NOT NULL')
      .getRawMany();

    return result.map((r) => r.category).filter(Boolean);
  }

  /**
   * Transform product entity to DTO
   */
  private transformProductToDto(product: ProductEntity): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      type: product.type,
      basePrice: Number(product.basePrice),
      currentPrice: product.currentPrice,
      currency: product.currency,
      salePrice: product.salePrice ? Number(product.salePrice) : undefined,
      isOnSale: product.isOnSale,
      discountPercentage: product.discountPercentage,
      subscriptionPlan: product.subscriptionPlan,
      billingCycle: product.billingCycle,
      trialDays: product.trialDays,
      isStoreCompliant: product.isStoreCompliant,
      requiresAppStorePayment: product.requiresAppStorePayment,
      allowedPaymentMethods: product.allowedPaymentMethods,
      features: product.features,
      salesCount: product.salesCount,
      averageRating: Number(product.averageRating),
      reviewCount: product.reviewCount,
      createdAt: product.createdAt,
    };
  }
}
