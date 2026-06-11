import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MongoService } from './../src/database/mongo.service';
import { Product } from './../src/products/product.types';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let products: Map<string, Product>;

  beforeEach(async () => {
    products = new Map([
      [
        'db-vizytky-classic',
        {
          id: 'db-vizytky-classic',
          title: 'Класичні візитки',
          category: 'Візитки',
          description: 'Двосторонній друк на крейдованому папері.',
          price: 350,
          options: ['90x50 мм'],
          source: 'user',
        },
      ],
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MongoService)
      .useValue({
        findProducts: jest.fn(async () => [...products.values()]),
        findProductById: jest.fn(async (id: string) => products.get(id)),
        createProduct: jest.fn(async (product: Product) => {
          products.set(product.id, product);
          return product;
        }),
        updateProduct: jest.fn(async (id: string, product: Product) => {
          products.set(id, product);
          return product;
        }),
        deleteProduct: jest.fn(async (id: string) => {
          products.delete(id);
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/products (GET) returns products without a token', () => {
    return request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: 'db-vizytky-classic' }),
          ]),
        );
      });
  });

  it('creates, updates and deletes products without a token', async () => {
    const productInput = {
      id: 'menu-a4',
      title: 'Меню A4',
      category: 'Меню',
      description: 'Меню для кафе та ресторанів.',
      price: 620,
      options: ['A4', 'ламінація'],
    };

    await request(app.getHttpServer())
      .post('/products')
      .send(productInput)
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: 'menu-a4',
          source: 'user',
        });
      });

    await request(app.getHttpServer())
      .patch('/products/menu-a4')
      .send({ price: 700 })
      .expect(200)
      .expect(({ body }) => {
        expect(body.price).toBe(700);
      });

    await request(app.getHttpServer())
      .delete('/products/menu-a4')
      .expect(204);
  });
});
