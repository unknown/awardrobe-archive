import { relations } from "drizzle-orm";
import { bigint, index, json, mysqlTable, serial, text } from "drizzle-orm/mysql-core";

import { prices } from "./prices";
import { productNotifications } from "./product-notifications";
import { products } from "./products";

export const productVariants = mysqlTable(
  "ProductVariant",
  {
    id: serial("id").primaryKey(),
    productId: bigint("productId", { mode: "bigint" }).notNull(),
    productUrl: text("productUrl").notNull(),
    attributes: json("attributes").notNull(),
    latestPriceId: bigint("latestPriceId", { mode: "bigint" }),
  },
  (productVariant) => ({
    productIdIx: index("productIdIx").on(productVariant.productId),
  }),
);

export const productVariantsRelations = relations(productVariants, ({ many, one }) => ({
  prices: many(prices, { relationName: "PriceToProductVariant" }),
  notifications: many(productNotifications, {
    relationName: "ProductNotificationToProductVariant",
  }),
  product: one(products, {
    relationName: "ProductToProductVariant",
    fields: [productVariants.productId],
    references: [products.id],
  }),
  latestPrice: one(prices, {
    relationName: "LatestPrice",
    fields: [productVariants.latestPriceId],
    references: [prices.id],
  }),
}));
