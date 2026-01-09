
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ProductForm } from '@/components/admin/product-form';
import { Product } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';


const variantSchema = z.object({
  id: z.string(),
  fit: z.enum(['regular', 'oversized']),
  color: z.enum(['black', 'white', 'beige']),
  size: z.enum(['s', 'm', 'l', 'xl', 'xxl']),
  price: z.coerce.number().min(1, 'Price must be > 0.'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative.'),
  imageId: z.string().min(1, 'Please select an image.'),
});

const formSchema = z.object({
  quote: z.string().min(5, 'Quote must be at least 5 characters.'),
  collection: z.enum(['drop-01']),
  description: z.string().min(10, 'Description is required.'),
  variants: z
    .array(variantSchema)
    .min(1, 'You must add at least one product variant.'),
});

const defaultValues = {
  quote: '',
  collection: 'drop-01' as const,
  description:
    'For the ones who feel deeply.\nSoft fabric, relaxed fit, everyday comfort.\nMade for slow days, late nights & honest hearts.',
  variants: [],
};

const newVariantDefault = {
  id: crypto.randomUUID(),
  imageId: 'regular-white-1',
  color: 'white' as const,
  fit: 'regular' as const,
  size: 'm' as const,
  price: 899,
  stock: 10,
};


export default function AdminProductsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();

  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('quote'));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleAdd = () => {
    setSelectedProduct(null);
    form.reset({
      ...defaultValues,
      variants: [newVariantDefault],
    });
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    form.reset(product);
    setDialogOpen(true);
  };

  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete || !productToDelete.id || !firestore) return;

    try {
      const productDocRef = doc(firestore, 'products', productToDelete.id);
      await deleteDoc(productDocRef);
      toast({
        title: 'Product Deleted',
        description: `"${productToDelete.quote}" has been removed from your store.`,
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error Deleting Product',
        description: `There was a problem removing "${productToDelete.quote}".`,
      });
    } finally {
        setDeleteDialogOpen(false);
        setProductToDelete(null);
    }
  };

  return (
    <>
      <ProductForm
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        product={selectedProduct}
        form={form}
        key={selectedProduct?.id || 'new'}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product 
              <span className="font-semibold"> "{productToDelete?.quote}"</span> and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your store's products.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2" />
          Add Product
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            A list of all the products in your store.
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
                <TableHead>Variants</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : products && products.length > 0 ? (
                products.map((product) => {
                  const firstVariantImage = getPlaceholderImage(product.variants?.[0]?.imageId);
                  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="hidden sm:table-cell">
                        {firstVariantImage && (
                          <div className="relative w-16 h-20 rounded-md overflow-hidden bg-secondary">
                            <Image
                              src={firstVariantImage.url}
                              alt={product.quote}
                              width={firstVariantImage.width}
                              height={firstVariantImage.height}
                              className="object-cover"
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.quote}
                      </TableCell>
                       <TableCell>
                        <Badge variant="outline">
                          {product.variants?.length || 0}
                        </Badge>
                      </TableCell>
                       <TableCell>
                         {totalStock > 0 ? `${totalStock} units` : <Badge variant="destructive">Out of Stock</Badge>}
                      </TableCell>
                       <TableCell className="capitalize">
                        {product.collection}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDelete(product)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No products found. Add your first product!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
