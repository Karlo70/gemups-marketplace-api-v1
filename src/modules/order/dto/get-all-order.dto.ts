import { IsOptional, IsUUID } from "class-validator";
import { GetAllDto } from "src/shared/dtos/getAll.dto";

export class GetAllOrder extends GetAllDto {
    
    @IsOptional()
    @IsUUID()
    user_id?:string
}