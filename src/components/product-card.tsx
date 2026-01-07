
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { placeholderImages } from "@/lib/placeholder-images.json";
import {
  Card,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const productImage = placeholderImages.find((p) => p.id === product.imageId);

  if (!productImage) {
    return null;
  }
  
  const minPrice = product.variants?.reduce((min, v) => v.price < min ? v.price : min, product.variants[0]?.price || 0);
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0);

  return (
    <Card className="group overflow-hidden relative border-0 shadow-none rounded-none bg-transparent flex flex-col">
       <Link href={`/product/${product.slug}`} className="block">
        <CardHeader className="p-0">
          <div className="aspect-[4/5] relative overflow-hidden">
            <Image
              src={productImage.imageUrl}
              alt={product.quote}
              fill
              className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
              data-ai-hint={productImage.imageHint}
            />
             {totalStock === 0 && (
                <Badge variant="destructive" className="absolute top-3 right-3">OUT OF STOCK</Badge>
            )}
          </div>
        </CardHeader>
      </Link>
      <div className="p-4 bg-secondary flex-grow flex flex-col">
          <h3 className="font-semibold text-lg tracking-tight flex-grow">{product.quote}</h3>
          <div className="flex justify-between items-center mt-4">
            <p className="font-bold text-lg">
                {minPrice > 0 ? `from ₹${minPrice}`: 'Not available'}
            </p>
            <Button variant="outline" size="sm" asChild>
                <Link href={`/product/${product.slug}`}>View</Link>
            </Button>
          </div>
      </div>
    </Card>
  );
}
