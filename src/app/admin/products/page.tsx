
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
import { Product, ProductVariant } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const SIZES: ProductVariant['size'][] = ['s', 'm', 'l', 'xl', 'xxl'];
const COLORS: ProductVariant['color'][] = ['beige', 'white', 'black'];

const imageAssignmentSchema = z.object({
    color: z.enum(COLORS),
    imageId: z.string().min(1, 'Please select an image for this color.'),
});

const variantGroupSchema = z.object({
  id: z.string(),
  fit: z.enum(['regular', 'oversized']),
  colors: z.array(z.string()).refine((value) => value.length > 0, {
    message: 'You have to select at least one color.',
  }),
  sizes: z.array(z.string()).refine((value) => value.length > 0, {
    message: 'You have to select at least one size.',
  }),
  price: z.coerce.number().min(1, 'Price must be > 0.'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative.'),
  imageAssignments: z.array(imageAssignmentSchema),
});

const formSchema = z.object({
  quote: z.string().min(5, 'Quote must be at least 5 characters.'),
  collection: z.string().min(1, 'Collection name is required.'),
  description: z.string().min(10, 'Description is required.'),
  variantGroups: z
    .array(variantGroupSchema)
    .min(1, 'You must add at least one product variant group.'),
}).refine(data => {
    for (const group of data.variantGroups) {
        const selectedColors = new Set(group.colors);
        const assignedColors = new Set(group.imageAssignments.map(ia => ia.color));
        if (selectedColors.size !== assignedColors.size) return false;
        for (const color of selectedColors) {
            if (!assignedColors.has(color)) return false;
        }
    }
    return true;
}, {
    message: "You must assign an image for each selected color in a variant group.",
    path: ["variantGroups"],
});


const defaultValues = {
  quote: '',
  collection: 'drop-01',
  description:
    'For the ones who feel deeply.\nSoft fabric, relaxed fit, everyday comfort.\nMade for slow days, late nights & honest hearts.',
  variantGroups: [],
};

const newVariantGroupDefault = {
  id: crypto.randomUUID(),
  fit: 'regular' as const,
  colors: ['white'] as ProductVariant['color'][],
  sizes: ['s', 'm', 'l'],
  price: 899,
  stock: 10,
  imageAssignments: [{ color: 'white' as const, imageId: 'regular-white-1' }],
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
    return Array.from(collectionSet);
  }, [products]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleAdd = () => {
    setSelectedProduct(null);
    form.reset({
      ...defaultValues,
      variantGroups: [{ ...newVariantGroupDefault, id: crypto.randomUUID() }],
    });
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    
    // This logic is complex with the new form structure.
    // It will group by fit, price, stock and then collect colors/sizes/images.
    const groupedByFitPriceStock = product.variants.reduce((acc, variant) => {
        const key = `${variant.fit}-${variant.price}-${variant.stock}`;
        if (!acc[key]) {
            acc[key] = {
                id: crypto.randomUUID(),
                fit: variant.fit,
                price: variant.price,
                stock: variant.stock,
                colors: new Set<ProductVariant['color']>(),
                sizes: new Set<ProductVariant['size']>(),
                imageAssignments: new Map<ProductVariant['color'], string>(),
            };
        }
        acc[key].colors.add(variant.color);
        acc[key].sizes.add(variant.size);
        if (!acc[key].imageAssignments.has(variant.color)) {
            acc[key].imageAssignments.set(variant.color, variant.imageId);
        }
        return acc;
    }, {} as Record<string, any>);

    const variantGroups = Object.values(groupedByFitPriceStock).map(group => ({
        ...group,
        colors: Array.from(group.colors),
        sizes: Array.from(group.sizes),
        imageAssignments: Array.from(group.imageAssignments.entries()).map(([color, imageId]) => ({ color, imageId })),
    }));


    form.reset({
        quote: product.quote,
        collection: product.collection,
        description: product.description,
        variantGroups: variantGroups,
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
