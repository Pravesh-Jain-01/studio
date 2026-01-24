
'use client';

import { ProductCard } from '@/components/product-card';
import type { Product } from '@/lib/types';

/**
 * @interface ProductGridProps
 * Defines the props for the ProductGrid component.
 */
interface ProductGridProps {
  allProducts: Product[];
}

/**
 * ProductGrid is a client component responsible for rendering a grid of products.
 * It takes an array of product data and maps over it to display individual ProductCard components.
 * @param {ProductGridProps} props - The props for the component.
 * @param {Product[]} props.allProducts - An array of product objects to be displayed.
 * @returns {JSX.Element} A grid of product cards or a message if no products are found.
 */
export function ProductGrid({ allProducts }: ProductGridProps) {
  
  if (!allProducts || allProducts.length === 0) {
    return (
      <div className="text-center col-span-full py-24">
        <p className="text-muted-foreground text-lg">no products found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {allProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
