import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Like } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, providers, ProductStatus } from './entities/product.entity';
import { User } from '../users/entities/user.entity';
import { GetAllProductsDto } from './dto/get-all-products.dto';
import { ValidationException } from 'src/utils/validation-exception-formatter';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto, user: User) {
    const existingProduct = await this.productRepository.findOne({
      where: { 
        name: createProductDto.name, 
        provider: createProductDto.provider,
        deleted_at: IsNull() 
      },
    });

    if (existingProduct) {
      throw new ValidationException({ 
        name: 'Product with this name and provider already exists' 
      });
    }

      const category = await this.categoryRepository.findOne({
        where: { id: createProductDto.category_id, deleted_at: IsNull() },
      });

      if (!category) {
        throw new ValidationException({ category_id: 'Category not found' });
      }

    const { image_url, ...rest } = createProductDto;

    const product = this.productRepository.create({
      ...rest,
      category: category,
    });

    if (image_url) {
      // const image = await this.fileService.uploadFile(image_url);
      // product.image_url = image.url;
    }

    await product.save();
    return product;
  }

  async findAll(getAllDto: GetAllProductsDto, user: User) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.deleted_at IS NULL');

    if (getAllDto.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${getAllDto.search}%` }
      );
    }

    if (getAllDto.provider) {
      queryBuilder.andWhere('product.provider = :provider', { 
        provider: getAllDto.provider 
      });
    }

    if (getAllDto.status) {
      queryBuilder.andWhere('product.status = :status', { 
        status: getAllDto.status 
      });
    }

    if (getAllDto.category_id) {
      queryBuilder.andWhere('product.category_id = :category_id', { 
        category_id: getAllDto.category_id 
      });
    }

    if (getAllDto.from) {
      queryBuilder.andWhere('product.created_at >= :from', { 
        from: getAllDto.from 
      });
    }

    if (getAllDto.to) {
      queryBuilder.andWhere('product.created_at <= :to', { 
        to: getAllDto.to 
      });
    }

    queryBuilder.orderBy('product.created_at', 'DESC');

    const options: IPaginationOptions = {
      page: getAllDto.page || 1,
      limit: getAllDto.per_page || 10,
    };

    return await paginate(queryBuilder, options);
  }

  async findOne({ id }: ParamIdDto, user: User) {
    const product = await this.productRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update({ id }: ParamIdDto, updateProductDto: UpdateProductDto, user: User) {
    const product = await this.findOne({ id }, user);

    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const existingProduct = await this.productRepository.findOne({
        where: { 
          name: updateProductDto.name, 
          provider: product.provider,
          deleted_at: IsNull() 
        },
      });

      if (existingProduct && existingProduct.id !== id) {
        throw new ValidationException({ 
          name: 'Product with this name and provider already exists' 
        });
      }
    }

    if (updateProductDto.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.category_id, deleted_at: IsNull() },
      });

      if (!category) {
        throw new ValidationException({ category_id: 'Category not found' });
      }
      product.category = category;
    }

    const { image_url, ...rest } = updateProductDto;

    Object.assign(product, {
      ...rest,
    });

    if (image_url) {
      // const image = await this.fileService.uploadFile(image_url);
      // product.image_url = image.url;
    }

    await product.save();

    return product;
  }

  async remove({ id }: ParamIdDto, user: User) {
    const product = await this.findOne({ id }, user);

    // Soft delete
    product.deleted_at = new Date();
    await product.save();

    return { message: 'Product deleted successfully' };
  }
}
