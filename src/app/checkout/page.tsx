
'use client';

import { useCart } from '@/context/cart-context';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useEffect, useMemo } from 'react';
import { collection, serverTimestamp, addDoc, doc, runTransaction, DocumentReference } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  address: z.string().min(10, { message: 'A valid address is required.' }),
  city: z.string().min(2, { message: 'City is required.' }),
  pincode: z.string().length(6, { message: 'A valid 6-digit pincode is required.' }),
  phone: z.string().min(10, { message: 'A valid phone number is required.' }),
});

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      pincode: '',
      phone: '',
    },
  });
  
  useEffect(() => {
    if (!isUserLoading && !user) {
        toast({
            variant: 'destructive',
            title: 'Please Log In',
            description: 'You need to be logged in to proceed to checkout.'
        })
      router.push('/login?redirect=/checkout');
    }
     if (!isUserLoading && cart.length === 0) {
        toast({
            title: 'Your cart is empty',
            description: 'Add some items to your cart before checking out.'
        })
        router.push('/shop');
    }
  }, [user, isUserLoading, router, toast, cart]);
  
  useEffect(() => {
    if (userData) {
      form.reset({
        ...form.getValues(),
        name: userData.name || '',
        phone: userData.phoneNumber || '',
      });
    }
  }, [userData, form]);


  if (isUserLoading || !user || cart.length === 0 || isProfileLoading) {
    return <div className="container py-12 text-center">Loading...</div>;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        if (!user || !firestore) return;

        try {
            const newOrderRef = await runTransaction(firestore, async (transaction) => {
                const ordersCollectionRef = collection(firestore, 'users', user.uid, 'orders');
                
                // 1. Create the new order document reference ahead of time
                const newOrderDocRef = doc(ordersCollectionRef);

                const orderData = {
                    shippingDetails: values,
                    items: cart,
                    subtotal,
                    shipping: 0,
                    total: subtotal,
                    status: 'placed',
                    createdAt: serverTimestamp(),
                };

                // 2. Go through each item in the cart to update stock
                for (const item of cart) {
                    const productRef = doc(firestore, 'products', item.productId) as DocumentReference<Product>;
                    const productDoc = await transaction.get(productRef);

                    if (!productDoc.exists()) {
                        throw new Error(`Product ${item.quote} not found.`);
                    }

                    const productData = productDoc.data();
                    const variantIndex = productData.variants.findIndex(v => v.id === item.variantId);
                    
                    if (variantIndex === -1) {
                        throw new Error(`Variant for ${item.quote} not found.`);
                    }

                    const currentStock = productData.variants[variantIndex].stock;
                    if (currentStock < item.quantity) {
                        throw new Error(`Not enough stock for ${item.quote} (${item.size.toUpperCase()}). Only ${currentStock} left.`);
                    }

                    // Prepare the update
                    const newVariants = [...productData.variants];
                    newVariants[variantIndex] = {
                        ...newVariants[variantIndex],
                        stock: currentStock - item.quantity,
                    };
                    
                    // Update the product document within the transaction
                    transaction.update(productRef, { variants: newVariants });
                }

                // 3. Set the order document now that all stock checks and updates passed
                transaction.set(newOrderDocRef, orderData);

                return newOrderDocRef;
            });

            toast({
                title: 'Order Placed!',
                description: 'Thank you for your purchase. Your feelings are on their way.',
            });
            
            clearCart();
            
            if (newOrderRef) {
                router.push(`/order-confirmation?orderId=${newOrderRef.id}`);
            } else {
                router.push('/order-confirmation');
            }

        } catch (e: any) {
            console.error("Transaction failed: ", e);
            toast({
                variant: "destructive",
                title: 'Order Failed',
                description: e.message || "There was a problem placing your order.",
            });
        }
    });
  }

  return (
    <div className="container py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Checkout</h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Almost there. Just a few more details.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-start">
        <div className="bg-secondary p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl><Input placeholder="Your house number and street" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                 <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl><Input placeholder="Your city" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField control={form.control} name="pincode" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl><Input placeholder="6-digit pincode" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="Your phone number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <Button type="submit" disabled={isPending} className="w-full" size="lg">
                {isPending ? 'Placing order...' : `Place Order (₹${subtotal.toFixed(2)})`}
              </Button>
            </form>
          </Form>
        </div>

        <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
           <h2 className="text-2xl font-bold mb-4">Your Order</h2>
            {cart.map((item) => {
              return (
                 <div key={item.variantId} className="flex gap-4 items-center">
                  <div className="w-20 h-24 relative rounded-md overflow-hidden bg-secondary border">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.quote}
                        fill
                        className="object-cover"
                        data-ai-hint="product photo"
                      />
                    )}
                     <div className="absolute -right-2 -top-2 bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">{item.quantity}</div>
                  </div>
                  <div className="flex-grow">
                     <h3 className="font-semibold">{item.quote}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                       {item.color} / {item.fit} / {item.size.toUpperCase()}
                    </p>
                  </div>
                  <div className="font-semibold">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              )
            })}
             <div className="space-y-2 border-t pt-4 mt-4">
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-border pt-4 mt-4">
                    <span>Total</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                </div>
            </div>
             <p className="text-xs text-center text-muted-foreground pt-4">
                By placing this order, you agree to our <Link href="/policies" className="underline">policies</Link>.
            </p>
        </div>
      </div>
    </div>
  );
}
