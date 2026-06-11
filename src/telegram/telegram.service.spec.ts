import { ServiceUnavailableException } from '@nestjs/common';
import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  const originalEnv = process.env;
  let fetchMock: jest.Mock;
  let service: TelegramService;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      TELEGRAM_BOT_TOKEN: 'bot-token',
      TELEGRAM_CHAT_ID: 'chat-id',
    };
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
    service = new TelegramService();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('sends callback requests to Telegram', async () => {
    await expect(
      service.sendCallbackRequest({
        name: 'Ada',
        phone: '+380001112233',
        message: 'Call me',
        page: '/contacts',
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Нова заявка на дзвінок'),
      }),
    );
  });

  it('sends purchases to Telegram', async () => {
    await expect(
      service.sendPurchase({
        name: 'Ada',
        phone: '+380001112233',
        items: [{ title: 'Візитки', quantity: 2, price: 350 }],
        total: 700,
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Нове замовлення'),
      }),
    );
  });

  it('fails when Telegram is not configured', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;

    await expect(
      service.sendCallbackRequest({
        name: 'Ada',
        phone: '+380001112233',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
