import { IsOptional, IsString, IsUUID } from "class-validator";
import { GetAllDto } from "src/shared/dtos/getAll.dto";

export class GetAllCallDto extends GetAllDto {

    @IsOptional()
    @IsString()
    @IsUUID()
    lead_id?: string;

    @IsOptional()
    @IsString()
    @IsUUID()
    assistant_id?: string;

}