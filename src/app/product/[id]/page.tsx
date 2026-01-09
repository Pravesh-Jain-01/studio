

'use client';

import { useState, useMemo, useEffect, use } from "react";
import Image from "next/image";
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
import { CheckCircle, Shield, Truck, XCircle, ShoppingBag } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/types";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { getPlaceholderImage, getPlaceholderImagesForVariant } from "@/lib/placeholder-images";


interface ProductPageProps {
  params: {
    id: string;
  };
}

const sizeGuide = [
    { size: 's', chest: 38, length: 26 },
    { size: 'm', chest: 40, length: 27 },
    { size: 'l', chest: 42, length: 28 },
    { size: 'xl', chest: 44, length: 29 },
    { size: 'xxl', chest: 46, length: 30 },
]

function ProductDetails({ id }: { id: string }) {
  const firestore = useFirestore();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const productDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'products', id);
  }, [firestore, id]);

  const { data: product, isLoading } = useDoc<Product>(productDocRef);

  const [selectedFit, setSelectedFit] = useState<ProductVariant['fit'] | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductVariant['color'] | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductVariant['size'] | null>(null);
  
  useEffect(() => {
    if (product?.variants) {
      const defaultVariant = product.variants[0];
      setSelectedFit(defaultVariant.fit);
      setSelectedColor(defaultVariant.color);
    }
  }, [product]);

  const availableFits = useMemo(() => {
    if (!product) return [];
    return [...new Set(product.variants.map(v => v.fit))]
  }, [product]);

  const availableColors = useMemo(() => {
    if (!product || !selectedFit) return [];
    return [...new Set(product.variants.filter(v => v.fit === selectedFit).map(v => v.color))];
  }, [product, selectedFit]);
  
  const availableSizes = useMemo(() => {
    if (!product || !selectedFit || !selectedColor) return [];
    return product.variants
        .filter(v => v.fit === selectedFit && v.color === selectedColor)
        .map(v => ({ size: v.size, stock: v.stock }))
        .sort((a, b) => sizeGuide.findIndex(s => s.size === a.size) - sizeGuide.findIndex(s => s.size === b.size));
  }, [product, selectedFit, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!product || !selectedFit || !selectedColor || !selectedSize) return null;
    return product.variants.find(v => v.fit === selectedFit && v.color === selectedColor && v.size === selectedSize) || null;
  }, [product, selectedFit, selectedColor, selectedSize]);

  const handleFitChange = (fit: ProductVariant['fit']) => {
    setSelectedFit(fit);
    const newAvailableColors = [...new Set(product!.variants.filter(v => v.fit === fit).map(v => v.color))];
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
    
    addToCart(product!, selectedVariant);
    toast({
      title: "Added to Bag!",
      description: `"${product!.quote}" has been added to your shopping bag.`,
    });
  };

  const variantForImages = product?.variants.find(v => v.fit === selectedFit && v.color === selectedColor);
  const images = getPlaceholderImagesForVariant(selectedVariant?.imageId || variantForImages?.imageId);
  const currentPrice = selectedVariant?.price ?? product?.variants.find(v => v.fit === selectedFit)?.price ?? product?.variants[0].price;

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="space-y-6">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-20 w-full" />
            <div className="space-y-4 pt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
       <div className="text-center py-24 border-2 border-dashed border-muted rounded-lg flex flex-col items-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">Sorry, we couldn't find the product you're looking for.</p>
          <Button asChild>
            <Link href="/shop">Back to Shop</Link>
          </Button>
        </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
        <Carousel className="w-full">
            <CarouselContent>
            {images.map((img, index) => (
                <CarouselItem key={index}>
                    <div className="aspect-[4/5] relative bg-secondary rounded-lg overflow-hidden">
                        <Image
                            src={img.url}
                            alt={`${product.quote} - image ${index + 1}`}
                            width={img.width}
                            height={img.height}
                            className="object-cover"
                        />
                    </div>
                </CarouselItem>
            ))}
            </CarouselContent>
            {images.length > 1 && (
                <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                </>
            )}
      </Carousel>

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
                  <p className="font-semibold w-16">Fit:</p>
                  <div className="flex gap-2 flex-wrap">
                      {availableFits.map(f => <Button key={f} variant={selectedFit === f ? 'default' : 'outline'} onClick={() => handleFitChange(f)} className="capitalize">{f}</Button>)}
                  </div>
              </div>

              {selectedFit && availableColors.length > 0 && <div className="flex items-center gap-4">
                  <p className="font-semibold w-16">Color:</p>
                  <div className="flex gap-2 flex-wrap">
                      {availableColors.map(c => <Button key={c} variant={selectedColor === c ? 'default' : 'outline'} onClick={() => handleColorChange(c)} className="capitalize">{c}</Button>)}
                  </div>
              </div>}

              {selectedFit && selectedColor && availableSizes.length > 0 && <div className="flex items-center gap-4">
                  <p className="font-semibold w-16">Size:</p>
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
          <Button size="lg" className="w-full text-lg py-6 font-bold" onClick={handleAddToCart} disabled={!selectedSize || selectedVariant?.stock === 0}>
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
            <AccordionTrigger className="text-lg">Size Guide</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Oversized fit:</strong> Designed for a relaxed, baggy look. Choose your usual size for the oversized vibe, or size down for a cleaner fit.
                <br/>
                <strong>Regular fit:</strong> True to size with a comfortable everyday feel.
              </p>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[100px]">Size</TableHead>
                          <TableHead>Chest (in)</TableHead>
                          <TableHead>Length (in)</TableHead>
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
            <AccordionTrigger className="text-lg">Care Instructions</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground italic mb-4">Because feelings deserve gentleness.</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Wash inside out with cold water</li>
                  <li>Tumble dry low or hang dry</li>
                  <li>Do not bleach or iron directly on print</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}


export default function ProductPage({ params }: ProductPageProps) {
    return (
      <div className="container mx-auto max-w-7xl py-12 md:py-20">
        <ProductDetails id={use(Promise.resolve(params.id))} />
      </div>
    )
}
