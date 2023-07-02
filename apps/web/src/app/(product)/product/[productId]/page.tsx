import Link from "next/link";
import { Button } from "@ui/Button";
import { getServerSession } from "next-auth";

import { Product, ProductVariant } from "@awardrobe/prisma-types";

import { ProductInfo } from "@/components/ProductInfo";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prisma";

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

type ProductPageProps = {
  params: { productId: string };
};

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: {
      variants: true,
    },
  });

  if (!product) {
    return (
      <section className="container max-w-4xl space-y-2">
        <h1 className="text-2xl font-medium">Product not found</h1>
        <p>The product you&apos;re looking couldn&apos;t be found</p>
        <div>
          <Link href="/">
            <Button>Go home</Button>
          </Link>
        </div>
      </section>
    );
  }

  const session = await getServerSession(authOptions);

  const notifications = session?.user.id
    ? await prisma.productNotification.findMany({
        where: {
          userId: session.user.id,
          productId: product.id,
        },
      })
    : [];

  const stylesSet = new Set<string>();
  const sizesSet = new Set<string>();
  product.variants.forEach((variant) => {
    stylesSet.add(variant.style);
    sizesSet.add(variant.size);
  });

  return (
    <ProductInfo
      product={product}
      styles={Array.from(stylesSet)}
      sizes={Array.from(sizesSet)}
      defaultNotifications={notifications}
    />
  );
}
