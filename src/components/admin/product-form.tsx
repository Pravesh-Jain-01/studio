
'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
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
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { PlusCircle, Trash2, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Combobox } from '../ui/combobox';
import { Progress } from '../ui/progress';

const SIZES: ProductVariant['size'][] = ['s', 'm', 'l', 'xl', 'xxl'];
const COLORS: ProductVariant['color'][] = ['beige', 'white', 'black'];


function ImageUploader({ 
    value, 
    onChange, 
    onUploadStateChange 
}: { 
    value: string | undefined, 
    onChange: (url: string) => void, 
    onUploadStateChange: (isUploading: boolean) => void 
}) {
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const storage = getStorage();
  const { toast } = useToast();

  React.useEffect(() => {
    onUploadStateChange(isUploading);
  }, [isUploading, onUploadStateChange]);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsUploading(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `products/${crypto.randomUUID()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        setIsUploading(false);
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onChange(downloadURL);
        setIsUploading(false);
        toast({ title: 'Upload Complete!' });
      }
    );
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-md border bg-muted flex-shrink-0 relative overflow-hidden">
        {value ? (
          <Image src={value} alt="Product variant" fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1">
        {isUploading ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">Uploading...</p>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        ) : (
          <label className="flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
            <UploadCloud className="h-4 w-4" />
            <span>{value ? 'Change Image' : 'Upload Image'}</span>
            <input type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp, image/gif" />
          </label>
        )}
      </div>
    </div>
  );
}


const imageAssignmentSchema = z.object({
    color: z.enum(COLORS),
    imageUrl: z.string().min(1, 'Please provide an image for this color.'),
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


export const productFormSchema = z.object({
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


type FormValues = z.infer<typeof productFormSchema>;


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
  imageAssignments: [{ color: 'white' as const, imageUrl: '' }],
};

export function ProductForm({ isOpen, setIsOpen, product, form, collections }: ProductFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();
  const [uploadingStatus, setUploadingStatus] = React.useState<Record<string, boolean>>({});

  const isAnyImageUploading = Object.values(uploadingStatus).some(Boolean);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variantGroups',
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      if (!firestore) return;
      
      const allVariants: ProductVariant[] = values.variantGroups.flatMap(group => {
        const imageMap = new Map(group.imageAssignments.map(ia => [ia.color, ia.imageUrl]));
        return group.colors.flatMap(color =>
            group.sizes.map(size => ({
              id: `${group.id}-${color}-${size}`,
              fit: group.fit,
              color: color as ProductVariant['color'],
              size: size as ProductVariant['size'],
              price: group.price,
              stock: group.stock,
              imageUrl: imageMap.get(color as ProductVariant['color'])!,
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
        form.setValue(`variantGroups.${groupIndex}.colors`, [...currentColors, color]);
        form.setValue(`variantGroups.${groupIndex}.imageAssignments`, [
            ...currentAssignments,
            { color, imageUrl: "" }
        ]);
    } else {
        form.setValue(`variantGroups.${groupIndex}.colors`, currentColors.filter((c: string) => c !== color));
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
                           {selectedColors && selectedColors.map((color: ProductVariant['color'], assignmentIndex: number) => {
                                const realAssignmentIndex = form.getValues(`variantGroups.${index}.imageAssignments`).findIndex((a: any) => a.color === color);
                                if (realAssignmentIndex === -1) return null;

                                return (
                                    <div key={color} className="flex items-center gap-4">
                                        <p className="w-20 capitalize text-sm font-medium">{color}</p>
                                        <FormField
                                            control={form.control}
                                            name={`variantGroups.${index}.imageAssignments.${realAssignmentIndex}.imageUrl`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <ImageUploader 
                                                            value={field.value} 
                                                            onChange={field.onChange}
                                                            onUploadStateChange={(isUploading) => {
                                                                setUploadingStatus(prev => ({
                                                                    ...prev,
                                                                    [field.name]: isUploading,
                                                                }))
                                                            }}
                                                        />
                                                    </FormControl>
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
                disabled={isPending || isAnyImageUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isAnyImageUploading}>
                {isPending
                  ? product
                    ? 'Saving...'
                    : 'Adding...'
                  : isAnyImageUploading
                  ? 'Uploading...'
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
