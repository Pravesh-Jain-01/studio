
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
    const { shippingDetails, cart, subtotal, userId, userEmail } = args;

    const { firestore } = initializeFirebase();
    const QIKINK_API_KEY = process.env.QIKINK_API_KEY;
    const QIKINK_API_SECRET = process.env.QIKINK_API_SECRET;

    if (!QIKINK_API_KEY || !QIKINK_API_SECRET) {
        console.error("Qikink API Key or Secret is not configured in .env.local");
        return { success: false, error: "Server configuration error: Fulfillment provider credentials missing." };
    }

    const [firstName, ...lastNameParts] = shippingDetails.name.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    const qikinkOrderPayload = {
        order_number: `ss-${userId.slice(0, 5)}-${Date.now()}`,
        qikink_shipping: "1",
        gateway: "COD",
        total_order_value: subtotal.toString(),
        line_items: cart.map(item => ({
            search_from_my_products: 0,
            quantity: item.quantity.toString(),
            print_type_id: 1,
            price: item.price.toString(),
            sku: item.qikinkSku,
            designs: [
                {
                    design_code: item.productId,
                    width_inches: "",
                    height_inches: "",
                    placement_sku: "fr",
                    design_link: item.designLink,
                    mockup_link: item.designLink
                }
            ]
        })),
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

    try {
        const response = await fetch('https://api.qikink.com/api/v1/order/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'key': QIKINK_API_KEY,
                'secret': QIKINK_API_SECRET,
            },
            body: JSON.stringify(qikinkOrderPayload),
        });

        const result = await response.json();

        if (!response.ok || result.status_code !== 200) {
            console.error('Qikink API Error:', result);
            return { success: false, error: result.message || 'Failed to place order with fulfillment provider.' };
        }

        const ordersCollectionRef = collection(firestore, 'users', userId, 'orders');
        const newOrderRef = await addDoc(ordersCollectionRef, {
            shippingDetails,
            items: cart,
            subtotal,
            shipping: 0,
            total: subtotal,
            status: 'placed',
            createdAt: serverTimestamp(),
            qikinkOrderId: result.result?.order?.order_id,
        });
        
        return { success: true, orderId: newOrderRef.id };

    } catch (error: any) {
        console.error("Error placing Qikink order:", error);
        return { success: false, error: "An unexpected error occurred while communicating with the fulfillment provider." };
    }
}
