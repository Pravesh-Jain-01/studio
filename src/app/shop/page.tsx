'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Product } from "@/lib/types";
import { collection, query } from "firebase/firestore";
import { ProductGrid } from "./product-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopPage() {
  const firestore = useFirestore();
  
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  return (
    <div className="container py-12 md:py-16">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">All Products</h1>
          <p className="mt-2 text-muted-foreground md:text-lg">emotions you can wear.</p>
        </div>
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
      ) : (
         <ProductGrid allProducts={products || []} />
      )}
    </div>
  );
}
