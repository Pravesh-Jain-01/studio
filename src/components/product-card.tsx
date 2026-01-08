
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { placeholderImages } from "@/lib/placeholder-images.json";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "./ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const firstVariant = product.variants?.[0];
  if (!firstVariant) return null;

  const productImage = placeholderImages.find((p) => p.id === firstVariant.imageId);

  if (!productImage) {
    return null;
  }
  
  const minPrice = product.variants?.reduce((min, v) => v.price < min ? v.price : min, product.variants[0]?.price || 0);
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0);

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <Card className="w-full overflow-hidden transition-shadow duration-300 hover:shadow-xl h-full flex flex-col">
        <div className="aspect-[4/5] relative">
          <Image
            src={productImage.imageUrl}
            alt={product.quote}
            fill
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
            data-ai-hint={productImage.imageHint}
          />
           {totalStock === 0 && (
              <Badge variant="destructive" className="absolute top-3 right-3 text-xs">OUT OF STOCK</Badge>
          )}
        </div>
        <CardContent className="p-4 flex flex-col flex-grow items-center text-center">
            <h3 className="font-semibold text-base tracking-tight flex-grow mb-1">{product.quote}</h3>
            <p className="font-bold text-lg text-muted-foreground">
                {minPrice > 0 ? `₹${minPrice}`: 'Not available'}
            </p>
        </CardContent>
      </Card>
    </Link>
  );
}
