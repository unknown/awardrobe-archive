import z from "zod";

export const productCollectionSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      lowContractPrice: z.number(),
      highContractPrice: z.number(),
      items: z.array(
        z.object({
          itemId: z.string(),
          listPrice: z.number(),
          offerPrice: z.number(),
          definingAttrs: z.record(
            z.string(),
            z.object({
              name: z.string(),
              description: z.string(),
              value: z.string(),
              sequence: z.number(),
              valueSequence: z.number(),
            }),
          ),
          inventory: z.object({ inventory: z.number() }),
        }),
      ),
    }),
  ),
});

export const searchSchema = z.array(
  z.object({
    results: z.object({
      stats: z.object({
        count: z.number(),
        total: z.number(),
        startNum: z.number(),
      }),
      products: z
        .array(
          z.object({
            productId: z.string(),
            collection: z.string(),
            productSeoToken: z.string(),
          }),
        )
        .optional(),
    }),
  }),
);
