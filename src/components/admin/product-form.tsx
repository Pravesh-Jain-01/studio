
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useFirestore, useStorage } from '@/firebase';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { PlusCircle, Trash2, Upload, X } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Combobox } from '../ui/combobox';
import { Progress } from '../ui/progress';

// #region ImageUploader Component
interface ImageUploaderProps {
  initialImageUrl?: string;
  onUploadComplete: (url: string) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  onClear: () => void;
}

function ImageUploader({ onUploadComplete, onUploadStart, onUploadEnd, onClear, initialImageUrl }: ImageUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState(initialImageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storage = useStorage();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && storage) {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      onUploadStart();

      const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (uploadError) => {
          console.error("Upload failed:", uploadError);
          setError("Upload failed. Check file type/size.");
          setIsUploading(false);
          onUploadEnd();
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => {
              setImageUrl(downloadURL);
              onUploadComplete(downloadURL);
            })
            .catch((urlError) => {
              console.error("Failed to get download URL:", urlError);
              setError("Upload complete, but failed to get URL.");
            })
            .finally(() => {
              setIsUploading(false);
              onUploadEnd();
            });
        }
      );
    }
  };

  const handleClear = () => {
    setImageUrl('');
    setUploadProgress(0);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    onClear();
  }

  return (
    <div className="flex items-center gap-4">
      {imageUrl && !isUploading ? (
        <div className="relative w-16 h-16 rounded-md overflow-hidden border bg-muted shrink-0">
          <Image src={imageUrl} alt="Uploaded product" fill className="object-cover" />
           <Button variant="destructive" size="icon" className="absolute top-0 right-0 h-5 w-5 opacity-80 hover:opacity-100" onClick={handleClear}>
              <X className="h-3 w-3" />
            </Button>
        </div>
      ) : (
        <div className="w-16 h-16 rounded-md border-2 border-dashed bg-muted flex items-center justify-center shrink-0">
            <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-grow">
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="text-xs h-9 file:mr-2 file:text-xs"
          accept="image/png, image/jpeg, image/webp"
          disabled={isUploading}
        />
        {isUploading && <Progress value={uploadProgress} className="mt-2 h-2" />}
        {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      </div>
    </div>
  );
}

// #endregion

const SIZES: ProductVariant['size'][] = ['s', 'm', 'l', 'xl', 'xxl'];
const COLORS: ProductVariant['color'][] = ['beige', 'white', 'black'];


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
    // This custom refinement ensures that for every selected color in a variant group,
    // there is a corresponding image assignment with a non-empty URL.
    for (const group of data.variantGroups) {
        const selectedColors = new Set(group.colors);
        const assignedColorsWithUrl = new Set(
            group.imageAssignments.filter(ia => ia.imageUrl).map(ia => ia.color)
        );
        if (selectedColors.size !== assignedColorsWithUrl.size) return false;
        for (const color of selectedColors) {
            if (!assignedColorsWithUrl.has(color)) return false;
        }
    }
    return true;
}, {
    message: "You must assign a valid image URL for each selected color.",
    path: ["variantGroups"], // This path helps React Hook Form to associate the error with the correct field group
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

  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const isAnyFileUploading = Object.values(uploadingFiles).some(status => status);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variantGroups',
  });

  const setUploaderStatus = useCallback((uploaderId: string, status: boolean) => {
    setUploadingFiles(prev => ({...prev, [uploaderId]: status}))
  }, []);

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
                            <FormLabel>Image Uploads</FormLabel>
                           {selectedColors && selectedColors.map((color: ProductVariant['color']) => {
                                const assignmentIndex = form.getValues(`variantGroups.${index}.imageAssignments`)
                                                            .findIndex((a: any) => a.color === color);
                                if (assignmentIndex === -1) return null;
                                
                                const uploaderId = `${field.id}-${color}`;

                                return (
                                    <div key={color} className="flex items-start gap-4">
                                        <p className="w-20 capitalize text-sm font-medium pt-2">{color}</p>
                                        <FormField
                                            control={form.control}
                                            name={`variantGroups.${index}.imageAssignments.${assignmentIndex}.imageUrl`}
                                            render={({ field: imageField }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <ImageUploader 
                                                          initialImageUrl={imageField.value}
                                                          onUploadStart={() => setUploaderStatus(uploaderId, true)}
                                                          onUploadEnd={() => setUploaderStatus(uploaderId, false)}
                                                          onUploadComplete={(url) => imageField.onChange(url)}
                                                          onClear={() => imageField.onChange('')}
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
                disabled={isPending || isAnyFileUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isAnyFileUploading}>
                {isAnyFileUploading ? 'Uploading...' : (isPending ? (product ? 'Saving...' : 'Adding...') : (product ? 'Save Changes' : 'Add Product'))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
