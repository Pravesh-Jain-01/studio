
'use client';

import { useState } from "react";
import { products } from "@/lib/products";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, Truck } from "lucide-react";
import type { Product } from "@/lib/types";

// This is now a client component, so we can't use generateStaticParams directly here.
// We'll handle product finding within the component.

interface ProductPageProps {
  params: {
    slug: string;
  };
}

const sizeGuide = [
    { size: 's', chest: 38, length: 26 },
    { size: 'm', chest: 40, length: 27 },
    { size: 'l', chest: 42, length: 28 },
    { size: 'xl', chest: 44, length: 29 },
    { size: 'xxl', chest: 46, length: 30 },
]

export default function ProductPage({ params: { slug } }: ProductPageProps) {
  const product = products.find((p) => p.slug === slug);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedFit, setSelectedFit] = useState<Product['fit']>(product?.fit || 'regular');
  const [selectedColor, setSelectedColor] = useState<Product['color']>(product?.color || 'white');

  if (!product) {
    notFound();
  }

  const productImage = placeholderImages.find((p) => p.id === product.imageId);
  const availableFits: Product['fit'][] = ['oversized', 'regular'];
  const availableColors: Product['color'][] = ['beige', 'white', 'black'];

  return (
    <div className="container mx-auto max-w-7xl py-12 md:py-20">
      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
        <div className="aspect-[4/5] relative bg-secondary rounded-lg overflow-hidden">
          {productImage && (
            <Image
              src={productImage.imageUrl}
              alt={product.quote}
              fill
              className="object-cover"
              data-ai-hint={productImage.imageHint}
            />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
             <Badge variant="secondary" className="mb-2 capitalize">{selectedFit} fit</Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {product.quote}
            </h1>
            <p className="text-2xl text-muted-foreground mt-2 font-medium capitalize">
              {selectedColor} Tee
            </p>
          </div>
          
          <p className="text-4xl font-bold">₹{product.price}</p>

          <div className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">
            {product.description}
          </div>
          
          <div className="flex flex-col gap-6">
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <p className="font-semibold w-16">color:</p>
                    <div className="flex gap-2">
                        {availableColors.map(c => <Button key={c} variant={selectedColor === c ? 'default' : 'outline'} onClick={() => setSelectedColor(c)} className="capitalize">{c}</Button>)}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <p className="font-semibold w-16">fit:</p>
                    <div className="flex gap-2">
                        {availableFits.map(f => <Button key={f} variant={selectedFit === f ? 'default' : 'outline'} onClick={() => setSelectedFit(f)} className="capitalize">{f}</Button>)}
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <p className="font-semibold w-16">size:</p>
                    <div className="flex gap-2">
                        {sizeGuide.map(s => <Button key={s.size} variant={selectedSize === s.size ? 'default' : 'outline'} size="icon" className="w-12 h-12 text-base" onClick={() => setSelectedSize(s.size)}>{s.size.toUpperCase()}</Button>)}
                    </div>
                </div>
            </div>
            <Button size="lg" className="w-full text-lg py-6 font-bold">add to bag</Button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center border-t pt-6">
              <div className="flex flex-col items-center gap-1">
                <Truck className="h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground">Fast Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <CheckCircle className="h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground">Premium Quality</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground">Secure Checkout</span>
              </div>
          </div>
          
          <Accordion type="single" collapsible className="w-full" defaultValue="size-guide">
            <AccordionItem value="size-guide">
              <AccordionTrigger className="text-lg">size guide</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>oversized fit:</strong> designed for a relaxed, baggy look. choose your usual size for the oversized vibe, or size down for a cleaner fit.
                  <br/>
                  <strong>regular fit:</strong> true to size with a comfortable everyday feel.
                </p>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">size</TableHead>
                            <TableHead>chest (in)</TableHead>
                            <TableHead>length (in)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sizeGuide.map(s => (
                            <TableRow key={s.size}>
                                <TableCell className="uppercase font-medium">{s.size}</TableCell>
                                <TableCell>{s.chest}"</TableCell>
                                <TableCell>{s.length}"</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger className="text-lg">care instructions</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground italic mb-4">because feelings deserve gentleness.</p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>wash inside out with cold water</li>
                    <li>tumble dry low or hang dry</li>
                    <li>do not bleach or iron directly on print</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
