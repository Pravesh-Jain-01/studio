import { products } from "@/lib/products";
import { ProductGrid } from "./product-grid";

export default function ShopPage() {
  return (
    <div className="container py-12 md:py-16">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">All Products</h1>
          <p className="mt-2 text-muted-foreground md:text-lg">emotions you can wear.</p>
        </div>
      </div>
      <ProductGrid allProducts={products} />
    </div>
  );
}
