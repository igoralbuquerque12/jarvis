import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AssistantToolGuard } from '../assistant/guards/assistant-tool.guard';
import { EventsController } from './controllers/events.controller';
import { EventsM2mController } from './controllers/events-m2m.controller';
import { EventsSchedule } from './schedules/events.schedule';
import { EventExecutionService } from './services/event-execution.service';
import { EventSeriesService } from './services/event-series.service';
import { EventsM2mService } from './services/events-m2m.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => ProfileModule),
    WhatsappModule,
  ],
  controllers: [EventsController, EventsM2mController],
  providers: [
    AssistantToolGuard,
    EventSeriesService,
    EventExecutionService,
    EventsM2mService,
    EventsSchedule,
  ],
  exports: [EventSeriesService, EventExecutionService],
})
export class EventsModule {}
