import { Body, Controller, Logger, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import type {
  CallbackRequestInput,
  PurchaseRequestInput,
  TelegramResponse,
} from './telegram.types';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Post('callback')
  sendCallbackRequest(
    @Body() input: CallbackRequestInput,
  ): Promise<TelegramResponse> {
    this.logger.log(
      `POST /telegram/callback name="${input.name ?? ''}" phone="${input.phone ?? ''}" page="${input.page ?? ''}"`,
    );

    return this.telegramService.sendCallbackRequest(input);
  }

  @Post('purchase')
  sendPurchase(@Body() input: PurchaseRequestInput): Promise<TelegramResponse> {
    this.logger.log(
      `POST /telegram/purchase name="${input.name ?? ''}" phone="${input.phone ?? ''}" items=${input.items?.length ?? 0} total=${input.total ?? 'n/a'}`,
    );

    return this.telegramService.sendPurchase(input);
  }
}
