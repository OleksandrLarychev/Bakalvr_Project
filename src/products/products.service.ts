import { randomUUID } from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { MongoService } from '../database/mongo.service';
import {
  CATEGORIES,
  Category,
  NewProductInput,
  Product,
  UpdateProductInput,
} from './product.types';

@Injectable()
export class ProductsService {
  constructor(private readonly database: MongoService) {}

  findAll(): Promise<Product[]> {
    return this.database.findProducts();
  }

  findOne(id: string): Promise<Product> {
    return this.database.findProductById(id);
  }

  create(input: NewProductInput): Promise<Product> {
    const product = this.toProduct(input);
    return this.database.createProduct(product);
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    if (input.id && input.id !== id) {
      throw new BadRequestException('Product id cannot be changed');
    }

    const current = await this.database.findProductById(id);
    const product = this.toProduct({
      ...current,
      ...input,
      id,
      options: input.options ?? current.options,
    });

    return this.database.updateProduct(id, product);
  }

  async remove(id: string): Promise<void> {
    await this.database.deleteProduct(id);
  }

  private toProduct(input: NewProductInput): Product {
    this.assertValidInput(input);

    return {
      id: input.id?.trim() || randomUUID(),
      title: input.title.trim(),
      category: input.category,
      description: input.description.trim(),
      price: input.price,
      image: input.image?.trim() || undefined,
      options:
        input.options?.map((option) => option.trim()).filter(Boolean) ?? [],
      source: 'user',
    };
  }

  private assertValidInput(input: NewProductInput): void {
    if (!input.title?.trim()) {
      throw new BadRequestException('Product title is required');
    }

    if (!this.isCategory(input.category)) {
      throw new BadRequestException('Product category is invalid');
    }

    if (!input.description?.trim()) {
      throw new BadRequestException('Product description is required');
    }

    if (typeof input.price !== 'number' || input.price < 0) {
      throw new BadRequestException('Product price must be a positive number');
    }

    if (input.options && !Array.isArray(input.options)) {
      throw new BadRequestException('Product options must be an array');
    }
  }

  private isCategory(category: unknown): category is Category {
    return CATEGORIES.includes(category as Category);
  }
}
