
'use client';

import React, { useEffect } from 'react';
import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
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
import { zodResolver } from '@hookform/resolvers/zod';

// Constants for select options to ensure consistency.
const SIZES: ProductVariant['size'][] = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
const COLORS: ProductVariant['color'][] = ['white', 'black', 'beige', 'navy-blue'];
const FITS: ProductVariant['fit'][] = ['regular', 'oversized'];

// Zod schema for a single size-specific variant.
const sizeVariantSchema = z.object({
  id: z.string(),
  size: z.enum(SIZES),
  price: z.coerce.number().min(1, 'Price must be > 0.'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative.'),
  qikinkSku: z.string().min(1, 'Qikink SKU is required.'),
});

// Zod schema for a "variant group" which shares fit, color, and images.
const variantGroupSchema = z.object({
  fit: z.enum(FITS),
  color: z.enum(COLORS),
  imageUrl: z.string().url('Please enter a valid image URL.').min(1, 'Image URL is required.'),
  designCode: z.string().min(1, 'Qikink Design Code is required.'),
  mockupLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sizes: z.array(sizeVariantSchema).min(1, "You must add at least one size."),
});

// The main Zod schema for the entire product form.
export const productFormSchema = z.object({
  quote: z.string().min(5, 'Quote must be at least 5 characters.'),
  collection: z.string().min(1, 'Collection name is required.'),
  description: z.string().min(10, 'Description is required.'),
  variantGroups: z.array(variantGroupSchema).min(1, 'You must add at least one product variant group.'),
});

type FormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
  form: UseFormReturn<FormValues>;
  collections: string[];
}

// Default values for a new size variant.
const newSizeDefault = {
    size: 'm' as const,
    price: 1299,
    stock: 20,
    qikinkSku: '',
    id: crypto.randomUUID()
}

// Default values for a new variant group.
const newVariantGroupDefault = {
  fit: 'regular' as const,
  color: 'white' as const,
  imageUrl: '',
  designCode: '',
  mockupLink: '',
  sizes: [{...newSizeDefault, id: crypto.randomUUID()}]
};

/**
 * ProductForm is a dialog-based form for adding and editing products.
 * It uses a nested structure of field arrays to manage complex product variants.
 * @param {ProductFormProps} props - The props for the component.
 * @returns {JSX.Element} The product form dialog.
 */
export function ProductForm({ isOpen, setIsOpen, product, form, collections }: ProductFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();

  const { fields: variantGroupFields, append: appendVariantGroup, remove: removeVariantGroup } = useFieldArray({
    control: form.control,
    name: 'variantGroups',
  });

  /**
   * Handles the submission of the product form.
   * It flattens the nested form data into the `ProductVariant[]` array structure required by Firestore.
   * @param {FormValues} values - The validated form data.
   */
  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      if (!firestore) return;

      try {
        // Flatten the nested variant groups into a single array of variants.
        const flattenedVariants: ProductVariant[] = values.variantGroups.flatMap(group => {
            return group.sizes.map(sizeVariant => ({
                ...sizeVariant,
                fit: group.fit,
                color: group.color,
                imageUrl: group.imageUrl,
                designCode: group.designCode,
                mockupLink: group.mockupLink || '',
            }));
        });

        const productData = {
          quote: values.quote,
          description: values.description,
          collection: values.collection,
          variants: flattenedVariants,
          details: { fit: 'athletic', fabric: 'performance blend', feel: 'lightweight and moisture-wicking' },
        };

        if (product?.id) {
          // Update an existing product.
          const productDocRef = doc(firestore, 'products', product.id);
          await updateDoc(productDocRef, productData);
          toast({ title: 'Product Updated!', description: `"${values.quote}" has been saved.` });
        } else {
          // Create a new product.
          const productsCollectionRef = collection(firestore, 'products');
          const newDocRef = await addDoc(productsCollectionRef, {id: '', ...productData});
          // Update the new document with its own ID for consistency.
          await updateDoc(newDocRef, {id: newDocRef.id});
          toast({ title: 'Product Added!', description: `"${values.quote}" has been added to your store.` });
        }
        setIsOpen(false);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Operation Failed', description: error.message || 'Could not save product.' });
      }
    });
  };

  const collectionOptions = collections.map(c => ({ label: c, value: c }));
 
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>{product ? 'Update the details of your product below.' : 'Fill in the details to create a new product.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6">
              {/* Core Product Details */}
              <div className="p-4 border rounded-lg bg-secondary/50">
                <h3 className="text-lg font-semibold mb-4">Core Details</h3>
                <div className="space-y-4">
                    <FormField control={form.control} name="quote" render={({ field }) => (
                        <FormItem><FormLabel>Product Name / Quote</FormLabel><FormControl><Input placeholder="e.g., 'Unleash Greatness Tee'" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="collection" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Collection</FormLabel><Combobox options={collectionOptions} value={field.value} onChange={field.onChange} placeholder="Select or create a collection..." /><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short description of the product..." className="resize-none" rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
              </div>

              {/* Variant Groups Section */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Variant Groups</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => appendVariantGroup(newVariantGroupDefault)}><PlusCircle className="mr-2" /> Add Group</Button>
                </div>
                <div className="space-y-6">
                  {variantGroupFields.map((groupField, groupIndex) => (
                    <VariantGroupField key={groupField.id} groupIndex={groupIndex} form={form} removeVariantGroup={removeVariantGroup} canRemove={variantGroupFields.length > 1} />
                  ))}
                </div>
                <FormField control={form.control} name="variantGroups" render={() => ( <FormItem><FormMessage className="mt-4 text-center" /></FormItem>)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? (product ? 'Saving...' : 'Adding...') : (product ? 'Save Changes' : 'Add Product')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface VariantGroupFieldProps {
    groupIndex: number;
    form: UseFormReturn<FormValues>;
    removeVariantGroup: (index: number) => void;
    canRemove: boolean;
}

/**
 * VariantGroupField is a component that renders the fields for a single variant group (fit + color).
 * It contains nested fields for shared properties and another field array for size-specific properties.
 * @param {VariantGroupFieldProps} props - The props for the component.
 * @returns {JSX.Element} A set of form fields for one variant group.
 */
function VariantGroupField({ groupIndex, form, removeVariantGroup, canRemove }: VariantGroupFieldProps) {
    const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
        control: form.control,
        name: `variantGroups.${groupIndex}.sizes`,
    });

    return (
        <div className="p-4 rounded-md bg-background border relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <FormField control={form.control} name={`variantGroups.${groupIndex}.fit`} render={({ field }) => (
                    <FormItem><FormLabel>Fit</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{FITS.map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name={`variantGroups.${groupIndex}.color`} render={({ field }) => (
                    <FormItem><FormLabel>Color</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{COLORS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name={`variantGroups.${groupIndex}.imageUrl`} render={({ field }) => (
                    <FormItem className="col-span-full"><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://i.ibb.co/..." {...field} /></FormControl><FormDescription>Direct image link for this fit/color combination.</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name={`variantGroups.${groupIndex}.designCode`} render={({ field }) => (
                    <FormItem><FormLabel>Design Code</FormLabel><FormControl><Input placeholder="Qikink Design Code" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name={`variantGroups.${groupIndex}.mockupLink`} render={({ field }) => (
                    <FormItem><FormLabel>Mockup Link</FormLabel><FormControl><Input placeholder="https://i.ibb.co/..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            {/* Size-specific variants */}
            <div className="border-t pt-4">
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-sm">Sizes</h4>
                    <Button type="button" size="sm" variant="ghost" onClick={() => appendSize({...newSizeDefault, id: crypto.randomUUID()})}><PlusCircle className="mr-2 h-4 w-4" /> Add Size</Button>
                </div>
                <div className="space-y-3">
                    {sizeFields.map((sizeField, sizeIndex) => (
                        <div key={sizeField.id} className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2 items-start bg-secondary/50 p-2 rounded-md relative">
                            <FormField control={form.control} name={`variantGroups.${groupIndex}.sizes.${sizeIndex}.size`} render={({ field }) => (
                                <FormItem><FormLabel>Size</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="bg-background h-9"><SelectValue /></SelectTrigger></FormControl><SelectContent>{SIZES.map(s => <SelectItem key={s} value={s} className="uppercase">{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name={`variantGroups.${groupIndex}.sizes.${sizeIndex}.qikinkSku`} render={({ field }) => (
                                <FormItem><FormLabel>Qikink SKU</FormLabel><FormControl><Input className="h-9" placeholder="SKU for this size" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`variantGroups.${groupIndex}.sizes.${sizeIndex}.price`} render={({ field }) => (
                                <FormItem><FormLabel>Price</FormLabel><FormControl><Input className="h-9" type="number" placeholder="1299" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`variantGroups.${groupIndex}.sizes.${sizeIndex}.stock`} render={({ field }) => (
                                <FormItem><FormLabel>Stock</FormLabel><FormControl><Input className="h-9" type="number" placeholder="20" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 text-destructive" onClick={() => removeSize(sizeIndex)} disabled={sizeFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                </div>
                 <FormField control={form.control} name={`variantGroups.${groupIndex}.sizes`} render={() => ( <FormItem><FormMessage className="mt-2 text-center" /></FormItem>)} />
            </div>

             <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeVariantGroup(groupIndex)} disabled={!canRemove}>
                <Trash2 className="h-4 w-4" />
             </Button>
        </div>
    )
}
