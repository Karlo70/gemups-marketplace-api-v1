import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ThirdPartyApiType, UseFor } from '../entities/third-party-api-key.entity';

export class CreateThirdPartyApiDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    name: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    description: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    key: string;

    @IsEnum(ThirdPartyApiType)
    type: ThirdPartyApiType;

    @IsEnum(UseFor)
    use_for: UseFor;

    @IsNumber()
    daily_limit: number;
}
