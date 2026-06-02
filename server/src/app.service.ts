import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      name: 'SOLFIN API',
      status: 'ok',
    };
  }
}
