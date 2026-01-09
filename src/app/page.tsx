
'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Gem } from 'lucide-react';
import { ProductCard } from "@/components/product-card";
import Image from "next/image";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Product } from "@/lib/types";
import { collection, limit, query } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlaceholderImage } from "@/lib/placeholder-images";

export default function Home() {
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(4));
  }, [firestore]);
  
  const { data: featuredProducts, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  const heroProductImage = getPlaceholderImage('hero');

  return (
    <div className="flex flex-col">
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center text-center overflow-hidden">
        {heroProductImage && (
          <Image
            src={heroProductImage.url}
            alt="healing हो रही है, slowly"
            fill
            className="object-cover object-top"
            priority
            data-ai-hint="soft light"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
        <div className="relative z-10 container px-4 md:px-6 flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-foreground shadow-lg">
            SoftSaath
          </h1>
          <p className="mt-4 max-w-[600px] text-foreground/80 md:text-xl/relaxed">
            Clothing for the soul. Curated expressions for the modern spirit.
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
              <h3 className="text-xl font-bold">Unique Designs</h3>
              <p className="text-sm text-muted-foreground">Wearable art that tells a story.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Gem className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Premium Quality</h3>
              <p className="text-sm text-muted-foreground">Crafted for comfort and longevity.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Zap className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Fast Shipping</h3>
              <p className="text-sm text-muted-foreground">Get your new favorite tee, delivered fast.</p>
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
              Get a glimpse of our latest collection. Find a piece that speaks to you.
            </p>
          </div>
          {areProductsLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-[400px] w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-1/4" />
                    </div>
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {featuredProducts?.map((product) => (
                <ProductCard key={product.id} product={product} />
                ))}
            </div>
          )}
           <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link href="/shop">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

       <section className="w-full py-16 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Join The Club</h2>
            <p className="mt-4 max-w-2xl mx-auto md:text-lg">
              Be the first to know about new drops, exclusive offers, and soft thoughts.
            </p>
            <form className="mt-8 flex max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-grow px-4 py-2 rounded-l-md text-foreground bg-background/20 placeholder:text-primary-foreground/80 focus:outline-none focus:ring-2 focus:ring-background" 
              />
              <Button type="submit" variant="secondary" className="rounded-l-none">
                Subscribe
              </Button>
            </form>
        </div>
      </section>
    </div>
  );
}
