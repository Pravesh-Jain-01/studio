
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { Badge } from "./ui/badge";

/**
 * @interface ProductCardProps
 * Defines the props for the ProductCard component.
 */
interface ProductCardProps {
  product: Product;
}

/**
 * ProductCard is a component that displays a summary of a product in a card format.
 * It is typically used in product grids on the home, shop, or collection pages.
 * @param {ProductCardProps} props - The props for the component.
 * @param {Product} props.product - The product data to display.
 * @returns {JSX.Element | null} A card component linking to the product's detail page, or null if the product has no variants.
 */
export function ProductCard({ product }: ProductCardProps) {
  // Use the first variant for displaying the image and price information.
  const firstVariant = product.variants?.[0];
  if (!firstVariant) return null;

  // Calculate the minimum price among all variants to display "From ₹X".
  const minPrice = product.variants?.reduce((min, v) => v.price < min ? v.price : min, product.variants[0]?.price || 0);
  // Calculate the total stock of all variants to determine if the product is out of stock.
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
