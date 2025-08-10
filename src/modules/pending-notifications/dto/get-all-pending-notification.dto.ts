import { IsOptional, IsUUID } from "class-validator";
import { GetAllDto } from "src/shared/dtos/getAll.dto";

export class GetAllPendingNotificationDto extends GetAllDto {
    @IsOptional()
    @IsUUID()
    lead_id: string;
}