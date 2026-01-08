
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { placeholderImages } from "@/lib/placeholder-images.json";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowRight } from "lucide-react";

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
    <Card className="group w-full overflow-hidden transition-shadow duration-300 hover:shadow-lg h-full flex flex-col">
       <Link href={`/product/${product.slug}`} className="block overflow-hidden">
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
      </Link>
      <CardContent className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-base tracking-tight flex-grow mb-2">{product.quote}</h3>
          <div className="flex justify-between items-end mt-4">
            <p className="font-bold text-lg">
                {minPrice > 0 ? `₹${minPrice}`: 'Not available'}
            </p>
            <Button variant="outline" size="sm" asChild>
                <Link href={`/product/${product.slug}`}>
                    View <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
            </Button>
          </div>
      </CardContent>
    </Card>
  );
}
