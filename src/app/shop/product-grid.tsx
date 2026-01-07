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
        <div className="flex gap-2 justify-center">
            <Button variant={fitFilter === 'all' ? 'default' : 'outline'} onClick={() => setFitFilter('all')}>all fits</Button>
            <Button variant={fitFilter === 'oversized' ? 'default' : 'outline'} onClick={() => setFitFilter('oversized')}>oversized</Button>
            <Button variant={fitFilter === 'regular' ? 'default' : 'outline'} onClick={() => setFitFilter('regular')}>regular</Button>
        </div>
         <div className="flex gap-2 justify-center">
            <Button variant={colorFilter === 'all' ? 'default' : 'outline'} onClick={() => setColorFilter('all')}>all colors</Button>
            <Button variant={colorFilter === 'beige' ? 'default' : 'outline'} onClick={() => setColorFilter('beige')}>beige</Button>
            <Button variant={colorFilter === 'white' ? 'default' : 'outline'} onClick={() => setColorFilter('white')}>white</Button>
            <Button variant={colorFilter === 'black' ? 'default' : 'outline'} onClick={() => setColorFilter('black')}>black</Button>
        </div>
      </div>
      <Separator className="mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {filteredProducts.length === 0 && (
          <div className="text-center col-span-full py-16">
              <p className="text-muted-foreground">no soft things found for this selection.</p>
          </div>
      )}
    </div>
  );
}
