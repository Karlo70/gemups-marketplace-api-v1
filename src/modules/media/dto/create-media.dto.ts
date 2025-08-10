import { IsNotEmpty } from 'class-validator';
import { IsFile, MemoryStoredFile } from 'nestjs-form-data';

export class CreateMediaDto {
  @IsFile({ message: 'must be a file' })
  @IsNotEmpty()
  file: MemoryStoredFile;

  @IsNotEmpty()
  folder_path: string;
}
