import { products } from "@/lib/products";
import { ProductGrid } from "./product-grid";

export default function ShopPage() {
  return (
    <div className="container py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">all products</h1>
        <p className="mt-2 text-muted-foreground">emotions you can wear.</p>
      </div>
      <ProductGrid allProducts={products} />
    </div>
  );
}
