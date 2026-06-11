import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  CallbackRequestInput,
  PurchaseItemInput,
  PurchaseRequestInput,
  TelegramResponse,
} from './telegram.types';

const TELEGRAM_API_URL = 'https://api.telegram.org';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  async sendCallbackRequest(
    input: CallbackRequestInput,
  ): Promise<TelegramResponse> {
    this.assertRequired(input.name, 'Name is required');
    this.assertRequired(input.phone, 'Phone is required');
    const name = input.name.trim();
    const phone = input.phone.trim();

    await this.sendMessage(
      [
        '<b>Нова заявка на дзвінок</b>',
        `Ім'я: ${this.escapeHtml(name)}`,
        `Телефон: ${this.escapeHtml(phone)}`,
        input.message?.trim()
          ? `Повідомлення: ${this.escapeHtml(input.message)}`
          : null,
        input.page?.trim() ? `Сторінка: ${this.escapeHtml(input.page)}` : null,
      ],
      'TELEGRAM_CALLBACK_CHAT_ID',
    );

    this.logger.log('Callback request was sent to Telegram');
    return { ok: true };
  }

  async sendPurchase(input: PurchaseRequestInput): Promise<TelegramResponse> {
    this.assertRequired(input.name, 'Name is required');
    this.assertRequired(input.phone, 'Phone is required');
    const name = input.name.trim();
    const phone = input.phone.trim();

    if (!input.items?.length) {
      throw new BadRequestException('Purchase items are required');
    }

    await this.sendMessage(
      [
        '<b>Нове замовлення</b>',
        input.id?.trim()
          ? `Номер замовлення: ${this.escapeHtml(input.id)}`
          : null,
        `Ім'я: ${this.escapeHtml(name)}`,
        `Телефон: ${this.escapeHtml(phone)}`,
        '',
        '<b>Товари:</b>',
        ...input.items.map((item, index) =>
          this.formatPurchaseItem(item, index),
        ),
        typeof input.total === 'number' ? '' : null,
        typeof input.total === 'number'
          ? `<b>Разом:</b> ${this.formatMoney(input.total)}`
          : null,
        input.comment?.trim()
          ? `Коментар: ${this.escapeHtml(input.comment)}`
          : null,
      ],
      'TELEGRAM_PURCHASE_CHAT_ID',
    );

    this.logger.log('Purchase request was sent to Telegram');
    return { ok: true };
  }

  private async sendMessage(
    lines: readonly (string | null)[],
    chatIdEnvName: string,
  ): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env[chatIdEnvName] ?? process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      this.logger.error(
        `Telegram config is missing: token=${token ? 'set' : 'missing'}, ${chatIdEnvName}=${process.env[chatIdEnvName] ? 'set' : 'missing'}, TELEGRAM_CHAT_ID=${process.env.TELEGRAM_CHAT_ID ? 'set' : 'missing'}`,
      );
      throw new ServiceUnavailableException('Telegram is not configured');
    }

    const text = lines.filter((line) => line !== null).join('\n');
    this.logger.log(
      `Sending Telegram message using ${chatIdEnvName}; chatId=${chatId}; textLength=${text.length}`,
    );

    const response = await fetch(
      `${TELEGRAM_API_URL}/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      },
    );

    if (!response.ok) {
      const responseText = await response.text();
      this.logger.error(
        `Telegram API failed: status=${response.status} body=${responseText}`,
      );
      throw new ServiceUnavailableException('Telegram message was not sent');
    }

    this.logger.log(`Telegram API responded with status=${response.status}`);
  }

  private formatPurchaseItem(item: PurchaseItemInput, index: number): string {
    const title = item.title?.trim() || `Товар ${index + 1}`;
    const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
    const price =
      typeof item.price === 'number'
        ? ` x ${this.formatMoney(item.price)}`
        : '';

    return `${index + 1}. ${this.escapeHtml(title)} - ${quantity} шт.${price}`;
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private assertRequired(
    value: string | undefined,
    message: string,
  ): asserts value is string {
    if (!value?.trim()) {
      throw new BadRequestException(message);
    }
  }

  private escapeHtml(value: string): string {
    return value
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
