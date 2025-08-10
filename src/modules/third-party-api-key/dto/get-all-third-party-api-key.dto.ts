import { IsOptional, IsString } from "class-validator";
import { GetAllDto } from "src/shared/dtos/getAll.dto";
import { ThirdPartyApiType, UseFor } from "../entities/third-party-api-key.entity";

export class GetAllThirdPartyApiKeyDto extends GetAllDto {

    @IsOptional()
    @IsString()
    type?: ThirdPartyApiType;

    @IsOptional()
    @IsString()
    use_for?: UseFor;
}