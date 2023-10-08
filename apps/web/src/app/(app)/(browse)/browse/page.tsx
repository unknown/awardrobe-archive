import { Fragment, Suspense } from "react";
import Link from "next/link";
import { Button } from "@ui/Button";
import { Skeleton } from "@ui/Skeleton";

import { meilisearch, Product } from "@awardrobe/meilisearch-types";

import { ProductList } from "@/components/product/ProductList";
import { ProductListControls } from "@/components/product/ProductListControls";

type BrowsePageProps = {
  searchParams: {
    search?: string;
    page?: string;
  };
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const search = searchParams.search ?? "";
  const page = searchParams.page ? Number(searchParams.page) : 1;

  const searchResponse = await meilisearch
    .index("products")
    .search(search, { page, hitsPerPage: 24 });
  const products = searchResponse.hits as Product[];

  const dateResponse = await fetch("http://worldtimeapi.org/api/timezone/America/New_York").then(
    (res) => res.json(),
  );
  const lastDate = new Date(dateResponse.datetime);

  return (
    <Fragment>
      <ProductListControls searchQuery={search} />
      <Suspense
        key={`${search}-${page}`}
        fallback={
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            <Skeleton className="h-[48px]" />
            <Skeleton className="h-[48px]" />
            <Skeleton className="h-[48px]" />
            <Skeleton className="h-[48px]" />
            <Skeleton className="h-[48px]" />
            <Skeleton className="h-[48px]" />
            <Skeleton className="h-[48px]" />
          </div>
        }
      >
        <ProductList products={products} />
      </Suspense>
      {searchResponse.totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          {[...Array(searchResponse.totalPages).keys()].map((index) => {
            const page = index + 1;
            const isCurrentPage = page === searchResponse.page;
            const pageButton = (
              <Button className="tabular-nums" variant="outline" size="sm" disabled={isCurrentPage}>
                {page}
              </Button>
            );
            if (isCurrentPage) {
              return <Fragment key={page}>{pageButton}</Fragment>;
            }
            return (
              <Link key={page} href={`/browse?search=${search}&page=${page}`} prefetch={false}>
                {pageButton}
              </Link>
            );
          })}
        </div>
      ) : null}
      <p className="text-muted-foreground text-center">Last updated: {lastDate.toLocaleString()}</p>
    </Fragment>
  );
}
