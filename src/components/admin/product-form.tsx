'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { useTransition, useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  useFirestore,
  useStorage,
  uploadFile,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { PlusCircle, Trash2, UploadCloud, X } from 'lucide-react';
import { Separator } from '../ui/separator';
import Image from 'next/image';
import { Progress } from '../ui/progress';

const variantSchema = z.object({
  id: z.string(),
  fit: z.enum(['regular', 'oversized']),
  color: z.enum(['black', 'white', 'beige']),
  size: z.enum(['s', 'm', 'l', 'xl', 'xxl']),
  price: z.coerce.number().min(1, 'Price must be > 0.'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative.'),
  imageUrls: z.array(z.string()).optional(),
  imageFiles: z.custom<File[]>().optional(),
}).refine(data => (data.imageUrls && data.imageUrls.length > 0) || (data.imageFiles && data.imageFiles.length > 0), {
    message: 'At least one image is required for the variant.',
    path: ['imageUrls'],
});


const formSchema = z.object({
  quote: z.string().min(5, 'Quote must be at least 5 characters.'),
  collection: z.enum(['drop-01']),
  description: z.string().min(10, 'Description is required.'),
  variants: z
    .array(variantSchema)
    .min(1, 'You must add at least one product variant.'),
});

interface ProductFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
}

export function ProductForm({ isOpen, setIsOpen, product }: ProductFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const firestore = useFirestore();
  const storage = useStorage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quote: '',
      collection: 'drop-01',
      description:
        'For the ones who feel deeply.\nSoft fabric, relaxed fit, everyday comfort.\nMade for slow days, late nights & honest hearts.',
      variants: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  useEffect(() => {
    if (isOpen) {
      if (product) {
        form.reset({
          ...product,
          variants: product.variants.map(v => ({...v, imageFiles: []}))
        });
      } else {
        form.reset({
          quote: '',
          collection: 'drop-01',
          description:
            'For the ones who feel deeply.\nSoft fabric, relaxed fit, everyday comfort.\nMade for slow days, late nights & honest hearts.',
          variants: [
            {
              id: crypto.randomUUID(),
              imageUrls: [],
              imageFiles: [],
              color: 'white',
              fit: 'regular',
              size: 'm',
              price: 899,
              stock: 10,
            },
          ],
        });
      }
    }
  }, [product, form, isOpen]);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 4);
      const variant = fields[index];
      update(index, { ...variant, imageFiles: files });
       form.trigger(`variants.${index}.imageUrls`);
    }
  };
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      if (!firestore || !storage) return;
      setUploadProgress(0);

      try {
        const variantsWithUrls = await Promise.all(
          values.variants.map(async (variant, index) => {
            let finalImageUrls = variant.imageUrls || [];

            if (variant.imageFiles && variant.imageFiles.length > 0) {
                const uploadedUrls = await Promise.all(
                    variant.imageFiles.map(file => 
                        uploadFile(storage, `products/${values.quote.replace(/\s+/g, '-')}/${file.name}`, file, (progress) => {
                            const totalFiles = values.variants.reduce((acc, v) => acc + (v.imageFiles?.length || 0), 0);
                            setUploadProgress(prev => (prev || 0) + progress / totalFiles);
                        })
                    )
                );
                finalImageUrls = uploadedUrls;
            }
            
            if (finalImageUrls.length === 0) {
              throw new Error(`Variant ${index + 1} has no images. Please upload at least one image.`);
            }

            const { imageFiles, ...rest } = variant;
            return { ...rest, imageUrls: finalImageUrls };
          })
        );
        
        setUploadProgress(100);

        const productData = {
          ...values,
          variants: variantsWithUrls,
          details: {
            fit: 'unisex',
            fabric: 'soft cotton',
            feel: 'breathable, gentle on skin',
          },
        };

        if (product?.id) {
          const productDocRef = doc(firestore, 'products', product.id);
          updateDocumentNonBlocking(productDocRef, productData);
          toast({
            title: 'Product Updated!',
            description: `"${values.quote}" has been saved.`,
          });
        } else {
          const productsCollectionRef = collection(firestore, 'products');
          addDocumentNonBlocking(productsCollectionRef, productData);
          toast({
            title: 'Product Added!',
            description: `"${values.quote}" has been added to your store.`,
          });
        }
        setIsOpen(false);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: error.message || 'Could not upload images and save product.',
        });
      } finally {
        setUploadProgress(null);
      }
    });
  };

  const addNewVariant = () => {
    append({
      id: crypto.randomUUID(),
      imageUrls: [],
      imageFiles: [],
      color: 'white',
      fit: 'regular',
      size: 'm',
      price: 899,
      stock: 10,
    });
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

              {/* --- VARIANTS SECTION --- */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Variants & Inventory
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
                  {fields.map((field, index) => {
                    const imageFiles = form.watch(`variants.${index}.imageFiles`);
                    const imageUrls = form.watch(`variants.${index}.imageUrls`);
                    const previews = imageFiles?.length
                      ? imageFiles.map(f => URL.createObjectURL(f))
                      : imageUrls || [];

                    return (
                    <div
                      key={field.id}
                      className="p-4 rounded-md bg-secondary/50 border relative"
                    >
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`variants.${index}.fit`}
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
                        <FormField
                          control={form.control}
                          name={`variants.${index}.size`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Size</FormLabel>
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
                      <Separator className="my-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`variants.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (INR)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="999" {...field} />
                              </FormControl>
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
                              <FormControl>
                                <Input type="number" placeholder="10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                       <Separator className="my-4" />
                        <Controller
                            control={form.control}
                            name={`variants.${index}.imageUrls`}
                            render={({ field: { onChange }, fieldState: { error } }) => (
                                <FormItem>
                                <FormLabel>Images (up to 4)</FormLabel>
                                <FormControl>
                                    <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:bg-gray-100">
                                    <UploadCloud className="h-8 w-8 text-gray-500" />
                                    <span className="mt-2 text-sm font-semibold text-gray-600">Click to upload</span>
                                    <span className="text-xs text-gray-500">PNG, JPG, WEBP (max 4)</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={(e) => handleImageChange(e, index)}
                                    />
                                    </label>
                                </FormControl>
                                <FormMessage>{error?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                       
                        {previews && previews.length > 0 && (
                            <div className="mt-4 grid grid-cols-4 gap-2">
                                {previews.map((src, i) => (
                                    <div key={i} className="relative aspect-square w-full">
                                        <Image src={src} alt={`Preview ${i}`} fill className="object-cover rounded-md" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                  )}
                  )}
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
              {isPending && uploadProgress !== null && (
                <div className="w-full flex items-center gap-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <span className='text-sm'>{Math.round(uploadProgress)}%</span>
                </div>
              )}
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
