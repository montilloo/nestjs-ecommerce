import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {
    console.log(this.configService.get('database.host'));

    console.log(this.configService.get('app.port'));
  }
}
