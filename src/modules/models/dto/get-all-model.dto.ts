import { IsEnum, IsOptional, IsString } from "class-validator";
import { GetAllDto } from "src/shared/dtos/getAll.dto";
import { ModelStatus, ModelType } from "../entities/model.entity";

export class GetAllModelDto extends GetAllDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsEnum(ModelType)
  type?: ModelType;

  @IsOptional()
  @IsString()
  status?: ModelStatus;

}