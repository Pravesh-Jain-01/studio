
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { placeholderImages } from "@/lib/placeholder-images.json";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "./ui/button";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const productImage = placeholderImages.find((p) => p.id === product.imageId);

  if (!productImage) {
    return null;
  }

  return (
    <Card className="group overflow-hidden relative border-0 shadow-none rounded-none bg-transparent">
      <Link href={`/product/${product.slug}`}>
        <CardHeader className="p-0">
          <div className="aspect-[4/5] relative overflow-hidden">
            <Image
              src={productImage.imageUrl}
              alt={product.quote}
              fill
              className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
              data-ai-hint={productImage.imageHint}
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </CardHeader>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h3 className="font-semibold text-lg text-primary-foreground tracking-tight">{product.quote}</h3>
          <p className="text-sm text-primary-foreground/70">{product.fit} fit</p>
        </div>
      </Link>
      <CardFooter className="p-4 pt-0 absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between">
        <p className="font-bold text-lg text-primary-foreground">₹{product.price}</p>
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/product/${product.slug}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
