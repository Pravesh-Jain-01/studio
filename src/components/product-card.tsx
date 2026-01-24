
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { Badge } from "./ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const firstVariant = product.variants?.[0];
  if (!firstVariant) return null;

  const minPrice = product.variants?.reduce((min, v) => v.price < min ? v.price : min, product.variants[0]?.price || 0);
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0);

  return (
    <Link href={`/product/${product.id}`} className="group block h-full">
      <div className="bg-card border h-full overflow-hidden rounded-lg transition-shadow duration-300 hover:shadow-xl flex flex-col">
        <div className="aspect-[4/5] w-full relative">
          {firstVariant.imageUrl && (
            <Image
                src={firstVariant.imageUrl}
                alt={product.quote}
                fill
                className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                data-ai-hint="calm minimal"
            />
          )}
           {totalStock === 0 && (
            <Badge variant="destructive" className="absolute top-3 right-3 text-xs">OUT OF STOCK</Badge>
          )}
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
             <h3 className="font-semibold text-base tracking-tight flex-grow">{product.quote}</h3>
             <p className="font-semibold text-lg mt-2">
                {minPrice > 0 ? `₹${minPrice}`: ''}
             </p>
        </div>
      </div>
    </Link>
  );
}
