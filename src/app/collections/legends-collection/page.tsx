
'use client';

import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Product } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";

/**
 * CollectionPage displays a grid of products belonging to a specific collection.
 * It fetches products from Firestore where the 'collection' field matches 'legends-collection'.
 * @returns {JSX.Element} The collection page UI.
 */
export default function CollectionPage() {
  const firestore = useFirestore();

  // Memoized Firestore query to fetch products for the 'legends-collection'.
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('collection', '==', 'legends-collection'));
  }, [firestore]);

  const { data: collectionProducts, isLoading } = useCollection<Product>(productsQuery);

  return (
    <div className="container py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">The Legends Collection</h1>
        <p className="mt-4 max-w-3xl mx-auto text-muted-foreground md:text-lg">
          Gear inspired by the greats. Built for the next generation of champions.
          Dominate your discipline in style.
        </p>
      </div>

       {isLoading ? (
        // Display skeleton loaders while products are being fetched.
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
        // Display the grid of product cards once data is loaded.
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {collectionProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        // Display a message if no products are found in the collection.
        <p className="text-center text-muted-foreground">No products found in this collection.</p>
      )}
    </div>
  );
}
