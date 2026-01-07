import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const productImage = PlaceHolderImages.find((p) => p.id === product.imageId);

  if (!productImage) {
    return null;
  }

  return (
    <Link href={`/product/${product.slug}`}>
      <Card className="h-full overflow-hidden transition-shadow duration-300 hover:shadow-lg bg-card">
        <CardHeader className="p-0">
          <div className="aspect-[4/5] relative">
            <Image
              src={productImage.imageUrl}
              alt={product.quote}
              fill
              className="object-cover"
              data-ai-hint={productImage.imageHint}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold text-base truncate">{product.quote}</h3>
          <p className="text-sm text-muted-foreground">{product.fit} fit</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <p className="font-medium">₹{product.price}</p>
        </CardFooter>
      </Card>
    </Link>
  );
}
