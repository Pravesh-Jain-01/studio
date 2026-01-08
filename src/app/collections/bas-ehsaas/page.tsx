'use client';

import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Product } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";

export default function CollectionPage() {
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('collection', '==', 'drop-01'));
  }, [firestore]);

  const { data: collectionProducts, isLoading } = useCollection<Product>(productsQuery);

  return (
    <div className="container py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Drop 01 — Bas Ehsaas</h1>
        <p className="mt-4 max-w-3xl mx-auto text-muted-foreground md:text-lg">
          A collection for the ones who feel deeply.
          Soft words, gentle reminders, and emotions you can wear.
        </p>
      </div>

       {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                </div>
            ))}
        </div>
      ) : collectionProducts && collectionProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {collectionProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">No products found in this collection.</p>
      )}
    </div>
  );
}
