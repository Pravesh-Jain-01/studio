
'use client';

import { useState, useMemo } from 'react';
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
import { ProductForm, productFormSchema } from '@/components/admin/product-form';
import { Product } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const defaultValues = {
  quote: '',
  collection: 'legends-collection',
  description:
    'Performance fabric for peak comfort.\nBreathable, durable, and ready for action.\nEngineered for champions.',
  variants: [],
};

const newVariantDefault = {
  id: crypto.randomUUID(),
  fit: 'regular' as const,
  color: 'white' as const,
  size: 'm' as const,
  price: 1299,
  stock: 20,
  imageUrl: '',
  qikinkSku: '',
  designCode: '',
  mockupLink: '',
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

  const collections = useMemoFirebase(() => {
    if (!products) return [];
    const collectionSet = new Set(products.map(p => p.collection));
    return Array.from(collectionSet).filter(Boolean);
  }, [products]);

  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const handleAdd = () => {
    setSelectedProduct(null);
    form.reset({
      ...defaultValues,
      variants: [{ ...newVariantDefault, id: crypto.randomUUID() }],
    });
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    
    form.reset({
        quote: product.quote,
        collection: product.collection,
        description: product.description,
        variants: product.variants,
    });
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
        collections={collections}
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
          <ScrollArea className="h-[60vh]">
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
                    const firstVariantImage = product.variants?.[0]?.imageUrl;
                    const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="hidden sm:table-cell">
                          {firstVariantImage && (
                            <div className="relative w-16 h-20 rounded-md overflow-hidden bg-secondary">
                              <Image
                                src={firstVariantImage}
                                alt={product.quote}
                                fill
                                className="object-cover"
                                data-ai-hint="product photo"
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
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
