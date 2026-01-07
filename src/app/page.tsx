import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Gem } from 'lucide-react';
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const featuredProducts = products.slice(0, 4);
  const heroProduct = products[2];
  const heroProductImage = PlaceHolderImages.find(p => p.id === heroProduct.imageId);

  return (
    <div className="flex flex-col">
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center text-center overflow-hidden">
        {heroProductImage && (
          <Image
            src={heroProductImage.imageUrl}
            alt={heroProduct.quote}
            fill
            className="object-cover object-top"
            priority
            data-ai-hint={heroProductImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
        <div className="relative z-10 container px-4 md:px-6 flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-foreground shadow-lg">
            softsaath
          </h1>
          <p className="mt-4 max-w-[600px] text-foreground/80 md:text-xl/relaxed">
            clothing for the soul. curated expressions for the modern spirit.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="font-bold">
              <Link href="/collections/bas-ehsaas">Explore Drop 01</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold">
              <Link href="/shop">Shop All <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 lg:py-32 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-3 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">unique designs</h3>
              <p className="text-sm text-muted-foreground">wearable art that tells a story.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Gem className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">premium quality</h3>
              <p className="text-sm text-muted-foreground">crafted for comfort and longevity.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Zap className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">fast shipping</h3>
              <p className="text-sm text-muted-foreground">get your new favorite tee, delivered fast.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Featured Pieces
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground md:text-lg">
              get a glimpse of our latest collection. find a piece that speaks to you.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
           <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link href="/shop">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

       <section className="w-full py-16 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">join the club</h2>
            <p className="mt-4 max-w-2xl mx-auto md:text-lg">
              be the first to know about new drops, exclusive offers, and soft thoughts.
            </p>
             <div className="mt-8 flex max-w-md mx-auto">
              <input type="email" placeholder="enter your email" className="flex-grow px-4 py-2 rounded-l-md text-foreground bg-background/20 placeholder:text-primary-foreground/80" />
              <Button type="submit" variant="secondary" className="rounded-l-none">Subscribe</Button>
            </div>
        </div>
      </section>
    </div>
  );
}
