export interface CallbackRequestInput {
  readonly name?: string;
  readonly phone?: string;
  readonly message?: string;
  readonly page?: string;
}

export interface PurchaseItemInput {
  readonly title?: string;
  readonly quantity?: number;
  readonly price?: number;
}

export interface PurchaseRequestInput {
  readonly id?: string;
  readonly name?: string;
  readonly phone?: string;
  readonly comment?: string;
  readonly items?: readonly PurchaseItemInput[];
  readonly total?: number;
}

export interface TelegramResponse {
  readonly ok: true;
}
