
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Product } from "@/lib/types";
import { collection, query } from "firebase/firestore";
import { ProductGrid } from "./product-grid";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ShopPage serves as the main product listing page for the store.
 * It fetches all products from Firestore and displays them in a grid.
 * @returns {JSX.Element} The main shop page UI.
 */
export default function ShopPage() {
  const firestore = useFirestore();
  
  // Memoized Firestore query to fetch all products.
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
          <p className="mt-2 text-muted-foreground md:text-lg">Emotions you can wear.</p>
        </div>
      </div>
       {isLoading ? (
        // Display skeleton loaders while products are being fetched.
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                </div>
            ))}
        </div>
      ) : (
        // Render the product grid once data is available.
         <ProductGrid allProducts={products || []} />
      )}
    </div>
  );
}
