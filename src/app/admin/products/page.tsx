import Image from 'next/image';
import { products } from '@/lib/products';
import { placeholderImages } from '@/lib/placeholder-images.json';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

export default function AdminProductsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>
          Manage your products here. You can add, edit, or delete them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Fit</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const productImage = placeholderImages.find(
                (p) => p.id === product.imageId
              );
              return (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    {productImage && (
                        <div className="relative w-16 h-20 rounded-md overflow-hidden bg-secondary">
                             <Image
                                src={productImage.imageUrl}
                                alt={product.quote}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.quote}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{product.fit}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{product.color}</TableCell>
                  <TableCell className="text-right font-semibold">₹{product.price}</TableCell>
                   <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
