'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useEffect } from 'react';
import { Product } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { placeholderImages } from '@/lib/placeholder-images.json';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  useFirestore,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';

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
  variants: z.array(variantSchema).min(1, "You must add at least one product variant."),
});

interface ProductFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
}

export function ProductForm({ isOpen, setIsOpen, product }: ProductFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quote: '',
      collection: 'drop-01',
      description: 'For the ones who feel deeply.\nSoft fabric, relaxed fit, everyday comfort.\nMade for slow days, late nights & honest hearts.',
      variants: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  useEffect(() => {
    if (product) {
      form.reset(product);
    } else {
      form.reset({
        quote: '',
        collection: 'drop-01',
        description: 'For the ones who feel deeply.\nSoft fabric, relaxed fit, everyday comfort.\nMade for slow days, late nights & honest hearts.',
        variants: [
            { id: crypto.randomUUID(), imageId: 'dil-soft-beige', color: 'white', fit: 'regular', size: 'm', price: 899, stock: 10 }
        ]
      });
    }
  }, [product, form, isOpen]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      if (!firestore) return;

      const productData = {
        ...values,
        details: { // Hardcoded for now as per original products.ts
          fit: 'unisex',
          fabric: 'soft cotton',
          feel: 'breathable, gentle on skin',
        }
      };

      if (product?.id) {
        // Update existing product
        const productDocRef = doc(firestore, 'products', product.id);
        updateDocumentNonBlocking(productDocRef, productData);
        toast({
          title: 'Product Updated!',
          description: `"${values.quote}" has been saved.`,
        });
      } else {
        // Create new product
        const productsCollectionRef = collection(firestore, 'products');
        await addDocumentNonBlocking(productsCollectionRef, productData);
        toast({
          title: 'Product Added!',
          description: `"${values.quote}" has been added to your store.`,
        });
      }
      setIsOpen(false);
    });
  };

  const addNewVariant = () => {
    append({
        id: crypto.randomUUID(),
        imageId: 'dil-soft-beige',
        color: 'white',
        fit: 'regular',
        size: 'm',
        price: 899,
        stock: 10
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {product
              ? 'Update the details of your product below.'
              : 'Fill in the details to create a new product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6">
                {/* --- MAIN PRODUCT DETAILS --- */}
                <div className="p-4 border rounded-lg bg-secondary/50">
                    <h3 className="text-lg font-semibold mb-4">Core Details</h3>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="quote"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quote</FormLabel>
                                <FormControl>
                                <Input placeholder="dil soft, intentions clear" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="A short description of the product..."
                                    className="resize-none"
                                    rows={4}
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* --- VARIANTS SECTION --- */}
                <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-semibold">Variants & Inventory</h3>
                         <Button type="button" size="sm" variant="outline" onClick={addNewVariant}>
                             <PlusCircle className="mr-2" /> Add Variant
                         </Button>
                    </div>

                    <div className="space-y-6">
                        {fields.map((field, index) => (
                        <div key={field.id} className="p-4 rounded-md bg-secondary/50 border relative">
                             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.fit`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Fit</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                            <SelectItem value="regular">Regular</SelectItem>
                                            <SelectItem value="oversized">Oversized</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.color`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Color</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                            <SelectItem value="beige">Beige</SelectItem>
                                            <SelectItem value="white">White</SelectItem>
                                            <SelectItem value="black">Black</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.size`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Size</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="s">S</SelectItem>
                                                <SelectItem value="m">M</SelectItem>
                                                <SelectItem value="l">L</SelectItem>
                                                <SelectItem value="xl">XL</SelectItem>
                                                <SelectItem value="xxl">XXL</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7"
                                    onClick={() => remove(index)}
                                    disabled={fields.length <= 1}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                             <Separator className="my-4"/>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.imageId`}
                                    render={({ field }) => (
                                    <FormItem className="md:col-span-1">
                                        <FormLabel>Image</FormLabel>
                                        <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        >
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Select image" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {placeholderImages.map((img) => (
                                            <SelectItem key={img.id} value={img.id}>
                                                {img.description}
                                            </SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.price`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Price (INR)</FormLabel>
                                        <FormControl><Input type="number" placeholder="999" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.stock`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Stock</FormLabel>
                                        <FormControl><Input type="number" placeholder="10" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                        </div>
                        ))}
                    </div>
                     <FormField
                        control={form.control}
                        name="variants"
                        render={() => <FormItem><FormMessage className="mt-4 text-center"/></FormItem>}
                    />
                </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? product
                    ? 'Saving...'
                    : 'Adding...'
                  : product
                  ? 'Save Changes'
                  : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
