
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useEffect, useMemo } from 'react';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { placeQikinkOrder } from './actions';

// List of Indian states for the shipping address form.
const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", 
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", 
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

// Zod schema for validating the shipping form data.
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  address: z.string().min(10, { message: 'A valid address is required.' }),
  city: z.string().min(2, { message: 'City is required.' }),
  province: z.string({ required_error: 'Please select a state.'}),
  pincode: z.string().length(6, { message: 'A valid 6-digit pincode is required.' }),
  phone: z.string().min(10, { message: 'A valid phone number is required.' }),
});

/**
 * CheckoutPage handles the final step of the purchasing process.
 * It collects the user's shipping information, displays an order summary, and places the order
 * by communicating with both the Qikink API and the application's Firestore database.
 * @returns {JSX.Element} The checkout page UI.
 */
export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Memoized Firestore document reference to the user's profile.
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
  
  // Effect to handle redirection if user is not logged in or cart is empty.
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
  
  // Effect to pre-fill form fields with data from the user's profile.
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

  // Calculate the subtotal of the cart.
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  /**
   * Handles the form submission for placing an order.
   * @param {z.infer<typeof formSchema>} values - The validated form values.
   */
  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        if (!user || !firestore) return;

        // Step 1: Call server action to place the order with the Qikink fulfillment service.
        const qikinkResult = await placeQikinkOrder({
            shippingDetails: values,
            cart,
            subtotal,
            userId: user.uid,
            userEmail: user.email || 'no-email@example.com',
        });

        // Step 2: Check if Qikink order placement was successful and returned an ID.
        if (qikinkResult.success && qikinkResult.qikinkOrderId) {
            try {
                // Step 3: If successful, save the order details to the app's own Firestore database.
                const ordersCollectionRef = collection(firestore, 'users', user.uid, 'orders');
                const newOrderRef = await addDoc(ordersCollectionRef, {
                    shippingDetails: values,
                    items: cart,
                    total: subtotal,
                    status: 'placed',
                    createdAt: serverTimestamp(),
                    qikinkOrderId: qikinkResult.qikinkOrderId,
                });

                // Step 4: On successful Firestore write, clear the cart, show a success toast, and redirect to the confirmation page.
                toast({
                    title: 'Order Placed!',
                    description: 'Thank you for your purchase. Your feelings are on their way.',
                });
                clearCart();
                router.push(`/order-confirmation?orderId=${newOrderRef.id}`);

            } catch (firestoreError: any) {
                // This handles errors during the Firestore write, e.g., if the user goes offline after the Qikink order is placed.
                console.error("Firestore order save error:", firestoreError);
                toast({
                    variant: "destructive",
                    title: 'Order Almost Placed...',
                    description: `Your order was sent to our fulfillment partner, but failed to save to your account. Please contact support with Qikink Order ID: ${qikinkResult.qikinkOrderId}`,
                });
            }
        } else {
             // Handle failure from the Qikink API.
             toast({
                variant: "destructive",
                title: 'Order Failed',
                description: qikinkResult.error || "There was a problem placing your order with our fulfillment partner.",
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
                    <FormLabel>Full Name</FormLabel>
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
                 <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>State / Province</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a state" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {indianStates.map(state => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
              </div>
               <div className="grid sm:grid-cols-2 gap-4">
                 <FormField control={form.control} name="pincode" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl><Input placeholder="6-digit pincode" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="Your phone number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
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
                  </div>
                  <div className="flex-grow">
                     <h3 className="font-semibold">{item.quote}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                       {item.color} / {item.fit} / {item.size.toUpperCase()} &bull; Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="font-semibold">
                    ₹{(item.price * item.quantity).toFixed(2)}
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

    
