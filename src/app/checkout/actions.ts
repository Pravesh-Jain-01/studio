
"use server";

import { initializeFirebase } from '@/firebase/index.server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { type CartItem } from '@/context/cart-context';

interface ShippingDetails {
    name: string;
    address: string;
    city: string;
    province: string;
    pincode: string;
    phone: string;
}

interface PlaceOrderArgs {
    shippingDetails: ShippingDetails;
    cart: CartItem[];
    subtotal: number;
    userId: string;
    userEmail: string;
}

export async function placeQikinkOrder(args: PlaceOrderArgs) {
    console.log('--- placeQikinkOrder ACTION INITIATED ---');
    console.log('--- Raw arguments received:', JSON.stringify(args, null, 2));

    const { shippingDetails, cart, subtotal, userId, userEmail } = args;

    const { firestore } = initializeFirebase();
    const QIKINK_API_KEY = process.env.QIKINK_API_KEY;
    const QIKINK_API_SECRET = process.env.QIKINK_API_SECRET;

    if (!QIKINK_API_KEY || !QIKINK_API_SECRET) {
        console.error("Qikink API Key or Secret is not configured in .env.local. Please check your .env.local file and restart the server.");
        return { success: false, error: "Server configuration error: Fulfillment provider credentials missing." };
    }

    const [firstName, ...lastNameParts] = shippingDetails.name.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    const qikinkOrderPayload = {
        order_number: `ss-${userId.slice(0, 5)}-${Date.now()}`,
        qikink_shipping: "1",
        gateway: "COD",
        total_order_value: subtotal.toString(),
        line_items: cart.map(item => {
            // Defensive coding: Corrects a malformed SKU that might exist in old cart/product data.
            // The root cause is likely stale product data in Firestore. Advise user to recreate the product.
            const correctedSku = item.qikinkSku.includes('-Wh-S-Wh-S') 
              ? item.qikinkSku.substring(0, item.qikinkSku.lastIndexOf('-Wh-S'))
              : item.qikinkSku;
            
            console.log(`Processing cart item. Original qikinkSku: "${item.qikinkSku}". Corrected SKU for API: "${correctedSku}"`);

            return {
                search_from_my_products: 0,
                quantity: item.quantity.toString(),
                print_type_id: 1,
                price: item.price.toString(),
                sku: correctedSku,
                designs: [
                    {
                        design_code: item.designCode,
                        width_inches: "",
                        height_inches: "",
                        placement_sku: "",
                        design_link: "",
                        mockup_link: ""
                    }
                ]
            }
        }),
        shipping_address: {
            first_name: firstName,
            last_name: lastName,
            address1: shippingDetails.address,
            phone: shippingDetails.phone,
            email: userEmail,
            city: shippingDetails.city,
            zip: shippingDetails.pincode,
            province: shippingDetails.province,
            country_code: "IN"
        }
    };
    
    console.log('--- FINAL Qikink Order Payload to be sent:', JSON.stringify(qikinkOrderPayload, null, 2));

    try {
        const response = await fetch('https://sandbox.qikink.com/api/order/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'key': QIKINK_API_KEY,
                'secret': QIKINK_API_SECRET,
            },
            body: JSON.stringify(qikinkOrderPayload),
        });

        const result = await response.json();
        console.log('--- Qikink API Response:', JSON.stringify(result, null, 2));


        if (!response.ok || result.status_code !== 200) {
            console.error('Qikink API Error:', result);
            return { success: false, error: result.message || 'Failed to place order with fulfillment provider.' };
        }
        
        const ordersCollectionRef = collection(firestore, 'users', userId, 'orders');
        const newOrderRef = await addDoc(ordersCollectionRef, {
            shippingDetails,
            items: cart,
            total: subtotal,
            status: 'placed',
            createdAt: serverTimestamp(),
            qikinkOrderId: result.result?.order?.order_id,
        });
        
        return { success: true, orderId: newOrderRef.id };

    } catch (error: any) {
        console.error("--- FATAL ERROR placing Qikink order:", error);
        return { success: false, error: "An unexpected error occurred while communicating with the fulfillment provider." };
    }
}
