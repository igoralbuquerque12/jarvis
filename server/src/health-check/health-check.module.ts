import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { HealthCheckController } from './controllers/health-check.controller';
import { HealthCheckSchedule } from './schedules/health-check.schedule';
import { HealthCheckCryptoService } from './services/health-check-crypto.service';
import { HealthCheckExecutionService } from './services/health-check-execution.service';
import { HealthCheckService } from './services/health-check.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => ProfileModule),
    WhatsappModule,
  ],
  controllers: [HealthCheckController],
  providers: [
    HealthCheckCryptoService,
    HealthCheckService,
    HealthCheckExecutionService,
    HealthCheckSchedule,
  ],
  exports: [HealthCheckService, HealthCheckExecutionService],
})
export class HealthCheckModule {}
