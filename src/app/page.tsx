
'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Trophy, ShieldCheck, Truck } from 'lucide-react';
import { ProductCard } from "@/components/product-card";
import Image from "next/image";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Product } from "@/lib/types";
import { collection, limit, query } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import { useState, useTransition, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { subscribeToNewsletter } from "./actions";

/**
 * The Home page component, serving as the main landing page for the application.
 * It features a hero section, key selling points, a grid of featured products,
 * and a newsletter subscription form.
 * @returns {JSX.Element} The home page UI.
 */
export default function Home() {
  const firestore = useFirestore();

  // Memoized Firestore query to fetch the first 4 products for the "Featured Gear" section.
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(4));
  }, [firestore]);
  
  const { data: featuredProducts, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  const heroProductImage = getPlaceholderImage('hero-sports');

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  /**
   * Handles the submission of the newsletter subscription form.
   * It calls the `subscribeToNewsletter` server action and provides user feedback.
   * @param {FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
        const result = await subscribeToNewsletter(email);
        if (result.success) {
             toast({
                title: "Subscribed!",
                description: result.message,
            });
            setEmail('');
        } else {
             toast({
                variant: 'destructive',
                title: "Subscription Failed",
                description: result.message,
            });
        }
    })
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center text-center overflow-hidden">
        {heroProductImage && (
          <Image
            src={heroProductImage.url}
            alt="An athlete in peak performance"
            fill
            className="object-cover object-center brightness-50"
            priority
            data-ai-hint="athlete intense"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
        <div className="relative z-10 container px-4 md:px-6 flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-primary-foreground shadow-lg">
            Podium Wear
          </h1>
          <p className="mt-4 max-w-[600px] text-primary-foreground/80 md:text-xl/relaxed">
            High-performance apparel for the modern athlete. Engineered for victory.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="font-bold">
              <Link href="/collections/legends-collection">Shop The Legends</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="font-bold">
              <Link href="/shop">Shop All <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 sm:grid-cols-3 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Champion-Inspired Designs</h3>
              <p className="text-sm text-muted-foreground">Apparel that embodies a winner's mindset.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Performance Fabrics</h3>
              <p className="text-sm text-muted-foreground">Built for comfort, durability, and peak performance.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Truck className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">Get in the game faster with our rapid shipping.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="w-full py-16 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Featured Gear
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground md:text-lg">
              Check out the top picks from our latest collection. Gear up for greatness.
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

      {/* Newsletter Subscription Section */}
       <section className="w-full py-16 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Join The Inner Circle</h2>
            <p className="mt-4 max-w-2xl mx-auto md:text-lg">
              Get exclusive access to new drops, athlete stories, and performance tips.
            </p>
            <form className="mt-8 flex max-w-md mx-auto" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-grow px-4 py-2 rounded-l-md text-foreground bg-background/80 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
              />
              <Button type="submit" variant="secondary" className="rounded-l-none" disabled={isPending}>
                {isPending ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
        </div>
      </section>
    </div>
  );
}
