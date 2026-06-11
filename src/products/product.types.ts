export const CATEGORIES = [
  'Візитки',
  'Флаєри',
  'Буклети',
  'Банери',
  'Наклейки',
  'Календарі',
  'Меню',
  'Каталоги',
  'Упаковка',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Product {
  readonly id: string;
  readonly title: string;
  readonly category: Category;
  readonly description: string;
  readonly price: number;
  readonly image?: string;
  readonly options: readonly string[];
  readonly source: 'seed' | 'user';
}

export interface NewProductInput {
  readonly id?: string;
  readonly title: string;
  readonly category: Category;
  readonly description: string;
  readonly price: number;
  readonly image?: string;
  readonly options?: readonly string[];
}

export type UpdateProductInput = Partial<NewProductInput>;
