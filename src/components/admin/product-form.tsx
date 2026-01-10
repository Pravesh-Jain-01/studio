
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
import { imagePlaceholders } from '@/lib/placeholder-images';
import { Checkbox } from '../ui/checkbox';
import { Combobox } from '../ui/combobox';

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
  imageAssignments: z.array(imageAssignmentSchema).refine(
    (data, ctx) => {
        // This refinement is complex because it depends on another field ('colors').
        // We will perform a check at the form level.
        return true;
    }
  ),
});


const formSchema = z.object({
  quote: z.string().min(5, 'Quote must be at least 5 characters.'),
  collection: z.string().min(1, 'Collection name is required.'),
  description: z.string().min(10, 'Description is required.'),
  variantGroups: z
    .array(variantGroupSchema)
    .min(1, 'You must add at least one product variant group.'),
}).refine(data => {
    // Top-level refinement to check if all selected colors have an image assignment
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
    path: ["variantGroups"], // You might point to a more specific path if needed
});


type FormValues = z.infer<typeof formSchema>;


interface ProductFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
  form: any;
  collections: string[];
}


const newVariantGroupDefault = {
  id: crypto.randomUUID(),
  fit: 'regular' as const,
  colors: ['white'] as ProductVariant['color'][],
  sizes: ['s', 'm', 'l'],
  price: 899,
  stock: 10,
  imageAssignments: [{ color: 'white' as const, imageId: 'regular-white-1' }],
};

export function ProductForm({ isOpen, setIsOpen, product, form, collections }: ProductFormProps) {
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
      
      const allVariants: ProductVariant[] = values.variantGroups.flatMap(group => {
        const imageMap = new Map(group.imageAssignments.map(ia => [ia.color, ia.imageId]));
        return group.colors.flatMap(color =>
            group.sizes.map(size => ({
              id: `${group.id}-${color}-${size}`,
              fit: group.fit,
              color: color as ProductVariant['color'],
              size: size as ProductVariant['size'],
              price: group.price,
              stock: group.stock,
              imageId: imageMap.get(color as ProductVariant['color'])!,
            }))
        )
      });

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
  
  const handleColorSelectionChange = (groupIndex: number, color: string, isChecked: boolean) => {
    const currentAssignments = form.getValues(`variantGroups.${groupIndex}.imageAssignments`);
    const currentColors = form.getValues(`variantGroups.${groupIndex}.colors`);
    
    if (isChecked) {
        // Add color
        form.setValue(`variantGroups.${groupIndex}.colors`, [...currentColors, color]);
        // Add a placeholder image assignment
        const defaultImageId = `${form.getValues(`variantGroups.${groupIndex}.fit`)}-${color}-1`;
        form.setValue(`variantGroups.${groupIndex}.imageAssignments`, [
            ...currentAssignments,
            { color, imageId: imagePlaceholders[defaultImageId] ? defaultImageId : 'default-placeholder' }
        ]);
    } else {
        // Remove color
        form.setValue(`variantGroups.${groupIndex}.colors`, currentColors.filter((c: string) => c !== color));
        // Remove image assignment
        form.setValue(`variantGroups.${groupIndex}.imageAssignments`, currentAssignments.filter((ia: { color: string }) => ia.color !== color));
    }
  };

 const collectionOptions = collections.map(c => ({ label: c, value: c }));

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
                  {fields.map((field, index) => {
                    const selectedColors = form.watch(`variantGroups.${index}.colors`);
                    return (
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
                         <div />

                        <div className="lg:col-span-2">
                             <FormField
                                control={form.control}
                                name={`variantGroups.${index}.colors`}
                                render={() => (
                                    <FormItem>
                                    <div className="mb-2">
                                        <FormLabel className="text-base">Colors</FormLabel>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        {COLORS.map((color) => (
                                        <FormField
                                            key={color}
                                            control={form.control}
                                            name={`variantGroups.${index}.colors`}
                                            render={({ field }) => {
                                            return (
                                                <FormItem
                                                key={color}
                                                className="flex flex-row items-start space-x-2 space-y-0"
                                                >
                                                <FormControl>
                                                    <Checkbox
                                                    checked={field.value?.includes(color)}
                                                    onCheckedChange={(checked) => handleColorSelectionChange(index, color, !!checked)}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal capitalize">
                                                    {color}
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


                        <div className="lg:col-span-2">
                           <FormField
                            control={form.control}
                            name={`variantGroups.${index}.sizes`}
                            render={() => (
                                <FormItem>
                                <div className="mb-2">
                                    <FormLabel className="text-base">Sizes</FormLabel>
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
                                    Applied to each selected size and color.
                                  </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                         <div className="lg:col-span-2 space-y-4">
                            <FormLabel>Image Assignments</FormLabel>
                           {selectedColors && selectedColors.map((color: ProductVariant['color']) => {
                                const assignmentIndex = form.getValues(`variantGroups.${index}.imageAssignments`).findIndex((a: any) => a.color === color);
                                if (assignmentIndex === -1) return null;

                                return (
                                    <div key={color} className="flex items-center gap-4">
                                        <p className="w-20 capitalize text-sm font-medium">{color}</p>
                                        <FormField
                                            control={form.control}
                                            name={`variantGroups.${index}.imageAssignments.${assignmentIndex}.imageId`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.entries(imagePlaceholders).map(([id, data]) => (
                                                            <SelectItem key={id} value={id}>{data.description}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )
                            })}
                             <FormField control={form.control} name={`variantGroups.${index}.imageAssignments`} render={() => (<FormMessage />)}/>
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
                  )})}
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
