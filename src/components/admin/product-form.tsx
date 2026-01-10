
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
import { Separator } from '../ui/separator';
import { imagePlaceholders } from '@/lib/placeholder-images';
import { Checkbox } from '../ui/checkbox';

const SIZES: ProductVariant['size'][] = ['s', 'm', 'l', 'xl', 'xxl'];

const variantGroupSchema = z.object({
  id: z.string(),
  fit: z.enum(['regular', 'oversized']),
  color: z.enum(['black', 'white', 'beige']),
  sizes: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one size.',
  }),
  price: z.coerce.number().min(1, 'Price must be > 0.'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative.'),
  imageId: z.string().min(1, 'Please select an image.'),
});

const formSchema = z.object({
  quote: z.string().min(5, 'Quote must be at least 5 characters.'),
  collection: z.enum(['drop-01']),
  description: z.string().min(10, 'Description is required.'),
  variantGroups: z
    .array(variantGroupSchema)
    .min(1, 'You must add at least one product variant group.'),
});

type FormValues = z.infer<typeof formSchema>;


interface ProductFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
  form: any;
}


const newVariantGroupDefault = {
  id: crypto.randomUUID(),
  imageId: 'regular-white-1',
  color: 'white' as const,
  fit: 'regular' as const,
  sizes: ['s', 'm', 'l'],
  price: 899,
  stock: 10,
};

export function ProductForm({ isOpen, setIsOpen, product, form }: ProductFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variantGroups',
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      if (!firestore) return;

      // Flatten variant groups into a single array of variants
      const allVariants: ProductVariant[] = values.variantGroups.flatMap(group => 
        group.sizes.map(size => ({
          id: `${group.id}-${size}`,
          fit: group.fit,
          color: group.color,
          size: size as ProductVariant['size'],
          price: group.price,
          stock: group.stock,
          imageId: group.imageId,
        }))
      );

      try {
        const productData = {
          quote: values.quote,
          description: values.description,
          collection: values.collection,
          variants: allVariants,
          details: {
            fit: 'unisex',
            fabric: 'soft cotton',
            feel: 'breathable, gentle on skin',
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
          await addDoc(productsCollectionRef, productData);
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

  const addNewVariantGroup = () => {
    append({ ...newVariantGroupDefault, id: crypto.randomUUID() });
  };

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
                          <Input
                            placeholder="dil soft, intentions clear"
                            {...field}
                          />
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

              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Variants & Inventory
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addNewVariantGroup}
                  >
                    <PlusCircle className="mr-2" /> Add Variant Group
                  </Button>
                </div>

                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-md bg-secondary/50 border relative"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                        <FormField
                          control={form.control}
                          name={`variantGroups.${index}.fit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fit</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="regular">
                                    Regular
                                  </SelectItem>
                                  <SelectItem value="oversized">
                                    Oversized
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variantGroups.${index}.color`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
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
                        <div className="lg:col-span-2">
                           <FormField
                            control={form.control}
                            name={`variantGroups.${index}.sizes`}
                            render={() => (
                                <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base">Sizes</FormLabel>
                                    <FormDescription>
                                    Select all available sizes for this fit and color.
                                    </FormDescription>
                                </div>
                                <div className="flex items-center space-x-4">
                                    {SIZES.map((size) => (
                                    <FormField
                                        key={size}
                                        control={form.control}
                                        name={`variantGroups.${index}.sizes`}
                                        render={({ field }) => {
                                        return (
                                            <FormItem
                                            key={size}
                                            className="flex flex-row items-start space-x-2 space-y-0"
                                            >
                                            <FormControl>
                                                <Checkbox
                                                checked={field.value?.includes(size)}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                    ? field.onChange([...(field.value || []), size])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value: string) => value !== size
                                                        )
                                                    )
                                                }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal uppercase">
                                                {size}
                                            </FormLabel>
                                            </FormItem>
                                        )
                                        }}
                                    />
                                    ))}
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name={`variantGroups.${index}.price`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Price (INR)</FormLabel>
                                <FormControl>
                                    <Input
                                    type="number"
                                    placeholder="999"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name={`variantGroups.${index}.stock`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Stock</FormLabel>
                                <FormControl>
                                    <Input
                                    type="number"
                                    placeholder="10"
                                    {...field}
                                    />
                                </FormControl>
                                 <FormDescription>
                                    Applied to each selected size.
                                  </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <div className="lg:col-span-2">
                            <FormField
                            control={form.control}
                            name={`variantGroups.${index}.imageId`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Image</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a placeholder image" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.entries(imagePlaceholders).map(([id, data]) => (
                                            <SelectItem key={id} value={id}>{data.description}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    This image set will be used for all selected sizes in this group.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
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
                  name="variantGroups"
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
