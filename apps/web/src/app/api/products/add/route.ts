import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { getAdapterFromUrl } from "@awardrobe/adapters";
import { meilisearch, Product as ProductDocument } from "@awardrobe/meilisearch-types";
import { Prisma, prisma, Product } from "@awardrobe/prisma-types";

import { authOptions } from "@/utils/auth";

type AddProductRequest = {
  productUrl: string;
};

type AddProductSuccess = {
  status: "success";
  product: Product;
};

type AddProductError = {
  status: "error";
  error: string;
};

export type AddProductResponse = AddProductSuccess | AddProductError;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json<AddProductResponse>(
      { status: "error", error: "Unauthenticated" },
      { status: 401 },
    );
  }

  // TODO: more descriptive errors
  try {
    const { productUrl }: AddProductRequest = await req.json();

    const adapter = getAdapterFromUrl(productUrl);
    const productCode = await adapter.getProductCode(productUrl);
    const { name, variants } = await adapter.getProductDetails(productCode);

    const product = await prisma.product.create({
      data: {
        productCode,
        name,
        store: { connect: { handle: adapter.storeHandle } },
        variants: {
          createMany: {
            data: variants.map(({ attributes, productUrl }) => ({ attributes, productUrl })),
          },
        },
      },
      include: { store: true },
    });

    const productDocument: ProductDocument = {
      id: product.id,
      name,
      storeName: product.store.name,
    };
    await meilisearch.index("products").addDocuments([productDocument], { primaryKey: "id" });

    revalidatePath("/(app)/(browse)/browse", "page");

    return NextResponse.json<AddProductResponse>({
      status: "success",
      product,
    });
  } catch (e) {
    console.error(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json<AddProductResponse>(
          {
            status: "error",
            error: "Product already exists",
          },
          { status: 400 },
        );
      }
    }
    return NextResponse.json<AddProductResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
