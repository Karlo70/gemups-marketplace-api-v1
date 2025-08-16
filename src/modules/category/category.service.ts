import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { ValidationException } from 'src/utils/validation-exception-formatter';
import { GetAllCategoriesDto } from './dto/get-all-categories.dto';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { paginate } from 'nestjs-typeorm-paginate';
import { User } from '../users/entities/user.entity';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto, user: User) {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name, deleted_at: IsNull() },
    });

    if (existingCategory) {
      throw new ValidationException({ name: 'Category name already exists' });
    }

    const { image_url, ...rest } = createCategoryDto;

    const category = this.categoryRepository.create(rest);

    if (image_url) {
      // const image = await this.fileService.uploadFile(image_url);
      // category.image_url = image.url;
    }

    await category.save();
    return category;
  }

  async findAll(getAllDto: GetAllCategoriesDto): Promise<Pagination<Category>> {
    const { page, per_page, search, status } = getAllDto;
    const queryBuilder = this.categoryRepository.createQueryBuilder('category');
    queryBuilder.where('category.deleted_at IS NULL');
    if (search) {
      queryBuilder.andWhere('category.name ILIKE :search', { search: `%${search}%` });
    }
    if (status) {
      queryBuilder.andWhere('category.status = :status', { status });
    }
    queryBuilder.orderBy('category.created_at', 'DESC');
    const PaginateOption: IPaginationOptions = {
      page: page || 1,
      limit: per_page || 10,
    };
    return await paginate(queryBuilder, PaginateOption);
  }

  async findOne({ id }: ParamIdDto) {
    const category = await this.categoryRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update({ id }: ParamIdDto, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne({ id });

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name, deleted_at: IsNull() },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ValidationException({ name: 'Category name already exists' });
      }
    }

    Object.assign(category, updateCategoryDto);
    await category.save();

    return category;
  }

  async remove({ id }: ParamIdDto, user: User) {
    const category = await this.findOne({ id });

    // Soft delete
    category.deleted_at = new Date();
    await category.save();

    return { message: 'Category deleted successfully' };
  }

}
