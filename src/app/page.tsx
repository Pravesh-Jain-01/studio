import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Leaf, Feather } from 'lucide-react';
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";

export default function Home() {
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="flex flex-col">
      <section className="w-full py-24 md:py-32 lg:py-48 text-center bg-accent/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-headline tracking-tighter">
              softsaath
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              for the soft hearts
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link href="/collections/bas-ehsaas">shop drop 01</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">drop 01 — bas ehsaas</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
              a collection for the ones who feel deeply.
              <br />
              soft words, gentle reminders, and emotions you can wear.
            </p>
            <Button asChild variant="link" className="mt-4 text-base">
              <Link href="/collections/bas-ehsaas">explore the collection →</Link>
            </Button>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 lg:py-32 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 sm:grid-cols-3 text-center">
            <div className="flex flex-col items-center gap-2">
              <Heart className="w-10 h-10 text-primary" />
              <h3 className="text-lg font-semibold">feelings over trends</h3>
              <p className="text-sm text-muted-foreground">emotions you can wear.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Leaf className="w-10 h-10 text-primary" />
              <h3 className="text-lg font-semibold">slow fashion</h3>
              <p className="text-sm text-muted-foreground">made with intention, for you.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Feather className="w-10 h-10 text-primary" />
              <h3 className="text-lg font-semibold">soft is strong</h3>
              <p className="text-sm text-muted-foreground">gentle reminders for everyday life.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-center mb-12">
            a few soft things
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
           <div className="text-center mt-12">
            <Button asChild>
              <Link href="/shop">view all products</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
