import { Controller, Get } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  /**
   * Health check endpoint for Railway
   * GET /health
   */
  @Public()
  @Get()
  check() {
    return { status: 'ok' };
  }
}
