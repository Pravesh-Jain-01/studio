'use client';

import { useState } from 'react';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

type Filter = 'all' | 'oversized' | 'regular';
type ColorFilter = 'all' | 'beige' | 'white' | 'black';

interface ProductGridProps {
  allProducts: Product[];
}

export function ProductGrid({ allProducts }: ProductGridProps) {
  const [fitFilter, setFitFilter] = useState<Filter>('all');
  const [colorFilter, setColorFilter] = useState<ColorFilter>('all');

  const filteredProducts = allProducts.filter((product) => {
    const fitMatch = fitFilter === 'all' || product.fit === fitFilter;
    const colorMatch = colorFilter === 'all' || product.color === colorFilter;
    return fitMatch && colorMatch;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <div className="flex gap-2 justify-center flex-wrap">
            <Button size="sm" variant={fitFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setFitFilter('all')}>all fits</Button>
            <Button size="sm" variant={fitFilter === 'oversized' ? 'secondary' : 'ghost'} onClick={() => setFitFilter('oversized')}>oversized</Button>
            <Button size="sm" variant={fitFilter === 'regular' ? 'secondary' : 'ghost'} onClick={() => setFitFilter('regular')}>regular</Button>
        </div>
         <div className="flex gap-2 justify-center flex-wrap">
            <Button size="sm" variant={colorFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setColorFilter('all')}>all colors</Button>
            <Button size="sm" variant={colorFilter === 'beige' ? 'secondary' : 'ghost'} onClick={() => setColorFilter('beige')}>beige</Button>
            <Button size="sm" variant={colorFilter === 'white' ? 'secondary' : 'ghost'} onClick={() => setColorFilter('white')}>white</Button>
            <Button size="sm" variant={colorFilter === 'black' ? 'secondary' : 'ghost'} onClick={() => setColorFilter('black')}>black</Button>
        </div>
      </div>
      <Separator className="mb-12 bg-border/20" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {filteredProducts.length === 0 && (
          <div className="text-center col-span-full py-24">
              <p className="text-muted-foreground text-lg">no products found for this selection.</p>
          </div>
      )}
    </div>
  );
}
