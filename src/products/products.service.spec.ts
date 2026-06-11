import { Test, TestingModule } from '@nestjs/testing';
import { MongoService } from '../database/mongo.service';
import { Product } from './product.types';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  const products: Product[] = [
    {
      id: 'db-vizytky-classic',
      title: 'Класичні візитки',
      category: 'Візитки',
      description: 'Двосторонній друк на крейдованому папері.',
      price: 350,
      options: ['90x50 мм'],
      source: 'user',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: MongoService,
          useValue: {
            findProducts: jest.fn().mockResolvedValue(products),
            findProductById: jest
              .fn()
              .mockImplementation(async (id: string) =>
                products.find((product) => product.id === id),
              ),
            createProduct: jest
              .fn()
              .mockImplementation(async (product) => product),
            updateProduct: jest
              .fn()
              .mockImplementation(async (_id, product) => product),
            deleteProduct: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('returns seed products without authentication concerns', async () => {
    await expect(service.findAll()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'db-vizytky-classic',
          source: 'user',
        }),
      ]),
    );
  });

  it('creates user products', async () => {
    const product = await service.create({
      id: 'stickers-round',
      title: 'Круглі наклейки',
      category: 'Наклейки',
      description: 'Наклейки для пакування та брендування.',
      price: 250,
      options: ['50 мм', '100 шт'],
    });

    expect(product).toMatchObject({
      id: 'stickers-round',
      source: 'user',
    });
  });
});
