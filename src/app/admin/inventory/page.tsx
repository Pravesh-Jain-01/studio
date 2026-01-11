
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
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
import { Product, ProductVariant } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InventoryItem extends ProductVariant {
  productId: string;
  productQuote: string;
}

export default function AdminInventoryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [filter, setFilter] = useState('');
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('quote'));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const inventoryItems = useMemo<InventoryItem[]>(() => {
    if (!products) return [];
    return products.flatMap(p => 
      p.variants.map(v => ({
        ...v,
        productId: p.id,
        productQuote: p.quote,
      }))
    );
  }, [products]);

  const filteredItems = useMemo(() => {
    if (!filter) return inventoryItems;
    return inventoryItems.filter(item => 
      item.productQuote.toLowerCase().includes(filter.toLowerCase()) ||
      item.id.toLowerCase().includes(filter.toLowerCase())
    );
  }, [inventoryItems, filter]);

  const handleStockChange = (variantId: string, newStock: string) => {
    const stock = parseInt(newStock, 10);
    setStockUpdates(prev => ({
      ...prev,
      [variantId]: isNaN(stock) ? 0 : stock,
    }));
  };
  
  const handleSaveChanges = async () => {
    if (Object.keys(stockUpdates).length === 0 || !firestore || !products) return;

    setIsSaving(true);
    const batch = writeBatch(firestore);

    try {
      // Create a map for quick product lookup
      const productsMap = new Map(products.map(p => [p.id, p]));

      for (const variantId in stockUpdates) {
        const updatedStock = stockUpdates[variantId];
        const item = inventoryItems.find(i => i.id === variantId);

        if (item) {
          const product = productsMap.get(item.productId);
          if (product) {
            const productRef = doc(firestore, 'products', product.id);
            const newVariants = product.variants.map(v => 
              v.id === variantId ? { ...v, stock: updatedStock } : v
            );
            batch.update(productRef, { variants: newVariants });
          }
        }
      }

      await batch.commit();

      toast({
        title: 'Inventory Updated',
        description: 'Stock levels have been saved successfully.',
      });
      setStockUpdates({});

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update inventory levels.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const hasChanges = Object.keys(stockUpdates).length > 0;

  return (
    <>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="mt-1 text-muted-foreground">
            View and update stock levels for all product variants.
          </p>
        </div>
        {hasChanges && (
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                <Save className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Variants</CardTitle>
          <CardDescription>
            A list of all product variants and their stock.
          </CardDescription>
           <Input 
              placeholder="Filter by product name or variant ID..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
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
                  <TableHead>Variant</TableHead>
                  <TableHead className="w-[120px]">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Loading inventory...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const image = getPlaceholderImage(item.imageId);
                    const currentStock = stockUpdates[item.id] ?? item.stock;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="hidden sm:table-cell">
                          {image && (
                            <div className="relative w-16 h-20 rounded-md overflow-hidden bg-secondary">
                              <Image
                                src={image.url}
                                alt={item.productQuote}
                                width={image.width}
                                height={image.height}
                                className="object-cover"
                                data-ai-hint="product photo"
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.productQuote}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <p className="capitalize">{item.color} / {item.fit}</p>
                          <p className="uppercase font-mono text-xs">{item.size}</p>
                        </TableCell>
                        <TableCell>
                          <Input 
                              type="number"
                              value={currentStock}
                              onChange={(e) => handleStockChange(item.id, e.target.value)}
                              className="h-9"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No variants found.
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
