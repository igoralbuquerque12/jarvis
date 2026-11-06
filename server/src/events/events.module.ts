import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { EventsController } from './controllers/events.controller';
import { EventsSchedule } from './schedules/events.schedule';
import { EventExecutionService } from './services/event-execution.service';
import { EventSeriesService } from './services/event-series.service';
import { EventsM2mService } from './services/events-m2m.service';
import { EventsMeService } from './services/events-me.service';
import { EventsToolService } from './services/events-tool.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => ProfileModule),
    WhatsappModule,
  ],
  controllers: [EventsController],
  providers: [
    EventSeriesService,
    EventExecutionService,
    EventsM2mService,
    EventsMeService,
    EventsToolService,
    EventsSchedule,
  ],
  exports: [EventSeriesService, EventExecutionService, EventsM2mService],
})
export class EventsModule {}
