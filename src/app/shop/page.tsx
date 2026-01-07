import { products } from "@/lib/products";
import { ProductGrid } from "./product-grid";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShopPage() {
  return (
    <div className="container py-12 md:py-16">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">All Products</h1>
          <p className="mt-2 text-muted-foreground md:text-lg">emotions you can wear.</p>
        </div>
        <Button variant="outline">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>
      <ProductGrid allProducts={products} />
    </div>
  );
}
