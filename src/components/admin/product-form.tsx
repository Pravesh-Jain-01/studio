
'use client';

import React from 'react';
import { useFieldArray } from 'react-hook-form';
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
import { useTransition } from 'react';
import { Product, ProductVariant } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useFirestore } from '@/firebase';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Combobox } from '../ui/combobox';

const SIZES: ProductVariant['size'][] = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
const COLORS: ProductVariant['color'][] = ['white', 'black', 'beige', 'navy-blue'];
const FITS: ProductVariant['fit'][] = ['regular', 'oversized'];

const variantSchema = z.object({
  id: z.string(),
  fit: z.enum(FITS),
  color: z.enum(COLORS),
  size: z.enum(SIZES),
  price: z.coerce.number().min(1, 'Price must be > 0.'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative.'),
  imageUrl: z.string().url('Please enter a valid image URL.').min(1, 'Image URL is required.'),
  qikinkSku: z.string().min(1, 'Qikink SKU is required.'),
  designCode: z.string().min(1, 'Qikink Design Code is required.'),
  mockupLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const productFormSchema = z.object({
  quote: z.string().min(5, 'Quote must be at least 5 characters.'),
  collection: z.string().min(1, 'Collection name is required.'),
  description: z.string().min(10, 'Description is required.'),
  variants: z.array(variantSchema).min(1, 'You must add at least one product variant.'),
});


type FormValues = z.infer<typeof productFormSchema>;


interface ProductFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
  form: any;
  collections: string[];
}

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

export function ProductForm({ isOpen, setIsOpen, product, form, collections }: ProductFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      if (!firestore) return;

      try {
        const productData = {
          quote: values.quote,
          description: values.description,
          collection: values.collection,
          variants: values.variants, // Variants are already in the correct format
          details: { // This can be static or derived if needed
            fit: 'athletic',
            fabric: 'performance blend',
            feel: 'lightweight and moisture-wicking',
          },
        };

        if (product?.id) {
          const productDocRef = doc(firestore, 'products', product.id);
          await updateDoc(productDocRef, productData);
          toast({
            title: 'Product Updated!',
            description: `"${values.quote}" has been saved.`,
          });
        } else {
          const productsCollectionRef = collection(firestore, 'products');
          const newDocRef = await addDoc(productsCollectionRef, {id: '', ...productData});
          await updateDoc(newDocRef, {id: newDocRef.id});
          toast({
            title: 'Product Added!',
            description: `"${values.quote}" has been added to your store.`,
          });
        }
        setIsOpen(false);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Operation Failed',
          description: error.message || 'Could not save product.',
        });
      }
    });
  };

  const addNewVariant = () => {
    append({ ...newVariantDefault, id: crypto.randomUUID() });
  };
  
 const collectionOptions = collections.map(c => ({ label: c, value: c }));
 
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-5xl">
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
              <div className="p-4 border rounded-lg bg-secondary/50">
                <h3 className="text-lg font-semibold mb-4">Core Details</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="quote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name / Quote</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 'Unleash Greatness Tee'"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="collection"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Collection</FormLabel>
                        <Combobox
                          options={collectionOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select or create a collection..."
                        />
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

              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Variants
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addNewVariant}
                  >
                    <PlusCircle className="mr-2" /> Add Variant
                  </Button>
                </div>

                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-md bg-secondary/50 border relative"
                    >
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                            <FormField control={form.control} name={`variants.${index}.fit`} render={({ field }) => (
                                <FormItem>
                                <FormLabel>Fit</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>{FITS.map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name={`variants.${index}.color`} render={({ field }) => (
                                <FormItem>
                                <FormLabel>Color</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>{COLORS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.size`} render={({ field }) => (
                                <FormItem>
                                <FormLabel>Size</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>{SIZES.map(s => <SelectItem key={s} value={s} className="uppercase">{s}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (
                                <FormItem><FormLabel>Price (INR)</FormLabel><FormControl><Input type="number" placeholder="1299" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.stock`} render={({ field }) => (
                                <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" placeholder="20" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name={`variants.${index}.qikinkSku`} render={({ field }) => (
                                <FormItem><FormLabel>Qikink SKU</FormLabel><FormControl><Input placeholder="Variant-specific SKU from Qikink" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.designCode`} render={({ field }) => (
                                <FormItem><FormLabel>Design Code</FormLabel><FormControl><Input placeholder="Qikink Design Code" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.mockupLink`} render={({ field }) => (
                                <FormItem><FormLabel>Mockup Link</FormLabel><FormControl><Input placeholder="https://i.ibb.co/..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />

                            <div className="col-span-full">
                                <FormField control={form.control} name={`variants.${index}.imageUrl`} render={({ field }) => (
                                    <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://i.ibb.co/..." {...field} /></FormControl>
                                    <FormDescription>Direct image link from a host like imgbb.com</FormDescription><FormMessage /></FormItem>
                                )} />
                            </div>
                      </div>
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
                  ))}
                </div>
                <FormField
                  control={form.control}
                  name="variants"
                  render={() => (
                    <FormItem>
                      <FormMessage className="mt-4 text-center" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (product ? 'Saving...' : 'Adding...') : (product ? 'Save Changes' : 'Add Product')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
