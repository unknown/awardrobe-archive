import { ProductInfo } from "@/components/ProductInfo";
import { prisma } from "@/utils/prisma";

interface ProductPageProps {
  params: { productId: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
  });

  if (!product) {
    return "Product not found";
  }

  const variants = await prisma.productVariant.findMany({
    where: {
      productId: product.id,
    },
  });

  const { styles, sizes } = variants.reduce(
    (prev, variant) => {
      prev.styles.add(variant.style);
      prev.sizes.add(variant.size);
      return prev;
    },
    { styles: new Set(), sizes: new Set() } as { styles: Set<string>; sizes: Set<string> }
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-xl">{product.name}</h1>
        <a
          href={`https://www.uniqlo.com/us/en/products/${product.productCode}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600"
        >
          View item on Uniqlo
        </a>
      </div>
      <ProductInfo productId={product.id} styles={Array.from(styles)} sizes={Array.from(sizes)} />
    </div>
  );
}
