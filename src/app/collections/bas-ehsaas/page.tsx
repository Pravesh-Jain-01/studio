import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";

export default function CollectionPage() {
  const collectionProducts = products.filter(p => p.collection === 'drop-01');

  return (
    <div className="container py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">drop 01 — bas ehsaas</h1>
        <p className="mt-4 max-w-3xl mx-auto text-muted-foreground md:text-lg">
          a collection for the ones who feel deeply.
          soft words, gentle reminders, and emotions you can wear.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {collectionProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
