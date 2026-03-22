import { Module } from '@nestjs/common';
import { TelegramBindingController } from './telegram-binding.controller';
import { TelegramBindingService } from './telegram-binding.service';

@Module({
  controllers: [TelegramBindingController],
  providers: [TelegramBindingService],
})
export class TelegramBindingModule {}
