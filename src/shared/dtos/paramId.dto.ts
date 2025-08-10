import { IsUUID } from 'class-validator';

export class ParamIdDto {
  @IsUUID()
  id: string;
}
