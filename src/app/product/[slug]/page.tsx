
'use client';

import { useState, useMemo } from "react";
import { products as staticProducts } from "@/lib/products";
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
import { CheckCircle, Shield, Truck, XCircle } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/types";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  // This page should be updated to fetch from Firestore in a real app
  const product = staticProducts.find((p) => p.slug === slug);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [selectedFit, setSelectedFit] = useState<ProductVariant['fit'] | null>(product?.variants[0]?.fit ?? null);
  const [selectedColor, setSelectedColor] = useState<ProductVariant['color'] | null>(product?.variants[0]?.color ?? null);
  const [selectedSize, setSelectedSize] = useState<ProductVariant['size'] | null>(null);

  if (!product) {
    notFound();
  }

  const availableFits = useMemo(() => [...new Set(product.variants.map(v => v.fit))], [product]);
  const availableColors = useMemo(() => {
    if (!selectedFit) return [];
    return [...new Set(product.variants.filter(v => v.fit === selectedFit).map(v => v.color))];
  }, [product, selectedFit]);
  
  const availableSizes = useMemo(() => {
    if (!selectedFit || !selectedColor) return [];
    return product.variants
        .filter(v => v.fit === selectedFit && v.color === selectedColor)
        .map(v => ({ size: v.size, stock: v.stock }))
        .sort((a, b) => sizeGuide.findIndex(s => s.size === a.size) - sizeGuide.findIndex(s => s.size === b.size));
  }, [product, selectedFit, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!selectedFit || !selectedColor || !selectedSize) return null;
    return product.variants.find(v => v.fit === selectedFit && v.color === selectedColor && v.size === selectedSize) || null;
  }, [product, selectedFit, selectedColor, selectedSize]);

  const handleFitChange = (fit: ProductVariant['fit']) => {
    setSelectedFit(fit);
    const newAvailableColors = [...new Set(product.variants.filter(v => v.fit === fit).map(v => v.color))];
    if (!newAvailableColors.includes(selectedColor!)) {
        setSelectedColor(newAvailableColors[0]);
    }
    setSelectedSize(null);
  }

  const handleColorChange = (color: ProductVariant['color']) => {
      setSelectedColor(color);
      setSelectedSize(null);
  }

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock === 0) {
      toast({
        variant: "destructive",
        title: "Unavailable",
        description: "This variant is out of stock.",
      });
      return;
    }

    if (!selectedSize) {
        toast({
            variant: "destructive",
            title: "Select a size",
            description: "Please select a size before adding to the bag.",
        });
        return;
    }
    
    addToCart(product, selectedVariant);
    toast({
      title: "Added to bag!",
      description: `"${product.quote}" has been added to your shopping bag.`,
    });
  };

  const productImage = placeholderImages.find((p) => p.id === product.imageId);
  const currentPrice = selectedVariant?.price ?? product.variants.find(v => v.fit === selectedFit)?.price ?? product.variants[0].price;

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
            {selectedFit && <Badge variant="secondary" className="mb-2 capitalize">{selectedFit} fit</Badge>}
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {product.quote}
            </h1>
            {selectedColor && <p className="text-2xl text-muted-foreground mt-2 font-medium capitalize">
              {selectedColor} Tee
            </p>}
          </div>
          
          <p className="text-4xl font-bold">₹{currentPrice}</p>

          <div className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">
            {product.description}
          </div>
          
          <div className="flex flex-col gap-6">
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <p className="font-semibold w-16">fit:</p>
                    <div className="flex gap-2 flex-wrap">
                        {availableFits.map(f => <Button key={f} variant={selectedFit === f ? 'default' : 'outline'} onClick={() => handleFitChange(f)} className="capitalize">{f}</Button>)}
                    </div>
                </div>

                {selectedFit && availableColors.length > 0 && <div className="flex items-center gap-4">
                    <p className="font-semibold w-16">color:</p>
                    <div className="flex gap-2 flex-wrap">
                        {availableColors.map(c => <Button key={c} variant={selectedColor === c ? 'default' : 'outline'} onClick={() => handleColorChange(c)} className="capitalize">{c}</Button>)}
                    </div>
                </div>}

                {selectedFit && selectedColor && availableSizes.length > 0 && <div className="flex items-center gap-4">
                    <p className="font-semibold w-16">size:</p>
                    <div className="flex gap-2 flex-wrap">
                        {availableSizes.map(({size, stock}) => (
                          <Button 
                            key={size} 
                            variant={selectedSize === size ? 'default' : 'outline'} 
                            size="icon" 
                            className={cn("w-12 h-12 text-base relative", stock === 0 && "text-muted-foreground/50 border-dashed")}
                            onClick={() => setSelectedSize(size)}
                            disabled={stock === 0}
                          >
                            {size.toUpperCase()}
                            {stock === 0 && <XCircle className="absolute -top-1 -right-1 h-4 w-4 text-destructive" />}
                          </Button>
                        ))}
                    </div>
                </div>}
            </div>
            <Button size="lg" className="w-full text-lg py-6 font-bold" onClick={handleAddToCart} disabled={!selectedVariant || selectedVariant.stock === 0}>
                {selectedVariant?.stock === 0 ? "Out of Stock" : "Add to Bag"}
            </Button>
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
