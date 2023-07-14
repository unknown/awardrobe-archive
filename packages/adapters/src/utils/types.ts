export type VariantAttribute = {
  name: string;
  value: string;
};

export type ProductPrice = {
  productUrl: string;
  attributes: VariantAttribute[];
  priceInCents: number;
  inStock: boolean;
};

type ProductDetailsResult = {
  name: string;
  prices: ProductPrice[];
};

export type StoreAdapter = {
  urlPrefixes: string[];
  storeHandle: string;
  // TODO: create pagination interface?
  getProducts: (limit?: number, useProxy?: boolean) => Promise<string[]>;
  getProductCode: (url: string, useProxy?: boolean) => Promise<string>;
  getProductDetails: (productCode: string, useProxy?: boolean) => Promise<ProductDetailsResult>;
};
