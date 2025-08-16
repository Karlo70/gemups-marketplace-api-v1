import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { CategoryStatus } from '../entities/category.entity';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @IsOptional()
    @IsEnum(CategoryStatus)
    status?: CategoryStatus;
}
