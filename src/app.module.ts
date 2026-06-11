import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './products/products.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [DatabaseModule, ProductsModule, TelegramModule],
})
export class AppModule {}
