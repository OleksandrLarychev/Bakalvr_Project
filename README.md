# Polygraphy Shop Server

## Команды запуска

```bash
npm install
npm run start
```

```bash
npm run start:dev
```

```bash
npm run start:prod
```

```bash
npm run test
npm run test:e2e
npm run build
```

## MongoDB

Сервер использует коллекцию `items`.

Переменные окружения можно положить в `.env` в корне `server`. Пример есть в `.env.example`.

По умолчанию режимы такие:

```text
npm run start / npm run start:dev -> mongodb://164.92.183.158:27017/polygraphy-shop
npm run start:prod             -> mongodb://127.0.0.1:27017/polygraphy-shop
```

Адрес можно переопределить переменными окружения:

```bash
MONGO_TARGET=remote
MONGO_HOST=164.92.183.158
MONGO_PORT=27017
MONGO_DATABASE=polygraphy-shop
MONGO_COLLECTION=items
MONGO_USERNAME=example_user
MONGO_PASSWORD=example_password
MONGO_AUTH_SOURCE=admin
```

Приложение не подмешивает моковые товары при старте: все товары читаются только из MongoDB.

## Эндпоинты

### GET /products

Получить список товаров.

### GET /products/:id

Получить товар по id.

### POST /products

Создать товар.

```json
{
  "id": "menu-a4",
  "title": "Меню A4",
  "category": "Меню",
  "description": "Меню для кафе та ресторанів.",
  "price": 620,
  "image": "https://example.com/image.jpg",
  "options": ["A4", "ламінація"]
}
```

### PATCH /products/:id

Редактировать товар.

```json
{
  "price": 700,
  "options": ["A4", "ламінація", "глянець"]
}
```

### DELETE /products/:id

Удалить товар.

## Telegram

Для отправки заявок в Telegram нужны переменные окружения:

```bash
TELEGRAM_BOT_TOKEN=123456:bot-token
TELEGRAM_CHAT_ID=123456789
```

Если заявки и покупки нужно отправлять в разные чаты:

```bash
TELEGRAM_CALLBACK_CHAT_ID=123456789
TELEGRAM_PURCHASE_CHAT_ID=987654321
```

### POST /telegram/callback

Заявка, чтобы перезвонили.

```json
{
  "name": "Іван",
  "phone": "+380001112233",
  "message": "Передзвоніть після 14:00",
  "page": "/contacts"
}
```

### POST /telegram/purchase

Заявка о покупке.

```json
{
  "name": "Іван",
  "phone": "+380001112233",
  "comment": "Потрібна доставка",
  "total": 700,
  "items": [{ "title": "Візитки", "quantity": 2, "price": 350 }]
}
```

## Категории

```text
Візитки
Флаєри
Буклети
Банери
Наклейки
Календарі
Меню
Каталоги
Упаковка
```
