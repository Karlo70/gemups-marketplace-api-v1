import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UrlService {
  constructor(private readonly configService: ConfigService) {}

  createUrl(path: string): string {
    const backendUrl = this.configService.get<string>('BACKEND_URL');
    const name = encodeURI(path.split('/').pop() || '');
    return `${backendUrl}/images/${name}`;
  }
}
