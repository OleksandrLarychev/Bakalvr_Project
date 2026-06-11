import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Collection, MongoClient, ObjectId } from 'mongodb';
import { Product } from '../products/product.types';

type ProductDocument = Omit<Product, 'id'> & {
  readonly _id: string | ObjectId;
  readonly id?: string;
};

const DATABASE_NAME = 'polygraphy-shop';
const COLLECTION_NAME = 'items';
const LOCAL_MONGO_HOST = '127.0.0.1';
const REMOTE_MONGO_HOST = '164.92.183.158';
const MONGO_PORT = '27017';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly client: MongoClient;
  private collection?: Collection<ProductDocument>;

  constructor() {
    this.client = new MongoClient(this.getMongoUri());
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.collection = this.client
      .db(this.getDatabaseName())
      .collection<ProductDocument>(this.getCollectionName());
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  async findProducts(): Promise<Product[]> {
    const products = await this.getCollection()
      .aggregate<ProductDocument>([
        {
          $addFields: {
            productId: { $ifNull: ['$id', { $toString: '$_id' }] },
          },
        },
        { $sort: { source: 1, title: 1 } },
        {
          $group: {
            _id: '$productId',
            product: { $first: '$$ROOT' },
          },
        },
        { $replaceRoot: { newRoot: '$product' } },
        { $unset: 'productId' },
        { $sort: { source: 1, title: 1 } },
      ])
      .toArray();

    return products.map(this.toProduct);
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.getCollection().findOne({ _id: id });

    if (!product) {
      throw new NotFoundException(`Product "${id}" was not found`);
    }

    return this.toProduct(product);
  }

  async createProduct(product: Product): Promise<Product> {
    try {
      await this.getCollection().insertOne(this.toDocument(product));
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(`Product "${product.id}" already exists`);
      }

      throw error;
    }

    return product;
  }

  async updateProduct(id: string, product: Product): Promise<Product> {
    const result = await this.getCollection().updateOne(
      { _id: id },
      { $set: product },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Product "${id}" was not found`);
    }

    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const result = await this.getCollection().deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Product "${id}" was not found`);
    }
  }

  private getCollection(): Collection<ProductDocument> {
    if (!this.collection) {
      throw new Error('MongoDB collection is not initialized');
    }

    return this.collection;
  }

  private getMongoUri(): string {
    if (process.env.MONGO_URI) {
      return process.env.MONGO_URI;
    }

    const host =
      process.env.MONGO_HOST ??
      (this.shouldUseLocalMongo() ? LOCAL_MONGO_HOST : REMOTE_MONGO_HOST);
    const port = process.env.MONGO_PORT ?? MONGO_PORT;
    const database = this.getDatabaseName();
    const credentials = this.getMongoCredentials();
    const query = this.getMongoQuery();

    return `mongodb://${credentials}${host}:${port}/${database}${query}`;
  }

  private getDatabaseName(): string {
    return process.env.MONGO_DATABASE || DATABASE_NAME;
  }

  private getCollectionName(): string {
    return process.env.MONGO_COLLECTION || COLLECTION_NAME;
  }

  private shouldUseLocalMongo(): boolean {
    return (
      process.env.MONGO_TARGET === 'local' ||
      process.env.NODE_ENV === 'production'
    );
  }

  private getMongoCredentials(): string {
    const username = process.env.MONGO_USERNAME;
    const password = process.env.MONGO_PASSWORD;

    if (!username || !password) {
      return '';
    }

    return `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
  }

  private getMongoQuery(): string {
    const params = new URLSearchParams();

    if (process.env.MONGO_AUTH_SOURCE) {
      params.set('authSource', process.env.MONGO_AUTH_SOURCE);
    }

    return params.size > 0 ? `?${params.toString()}` : '';
  }

  private toDocument(product: Product): ProductDocument {
    return {
      ...product,
      _id: product.id,
    };
  }

  private toProduct(document: ProductDocument): Product {
    return {
      id: document.id ?? document._id.toString(),
      title: document.title,
      category: document.category,
      description: document.description,
      price: document.price,
      image: document.image,
      options: document.options,
      source: document.source,
    };
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
