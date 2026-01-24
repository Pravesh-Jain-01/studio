
"use server";

import { initializeFirebase } from '@/firebase/index.server';
import { collection, addDoc, serverTimestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
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
    const QIKINK_API_KEY = process.env.QIKINK_API_KEY || '814276779348448';
    const QIKINK_API_SECRET = process.env.QIKINK_API_SECRET || 'f2b956c12481492e255a85b5107b6229abf9be2a3460a9e4337982e75ab0cff0';

    if (!QIKINK_API_KEY || !QIKINK_API_SECRET) {
        return { success: false, error: "Server configuration error: Fulfillment provider API credentials are not set." };
    }

    try {
        // Step 1: Authenticate and get the bearer token
        const tokenResponse = await fetch('https://sandbox.qikink.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: QIKINK_API_KEY,
                password: QIKINK_API_SECRET,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.access_token) {
            return { success: false, error: `Qikink Auth Failed: ${tokenData.message || 'Could not retrieve access token.'}` };
        }
        
        const accessToken = tokenData.access_token;

        // Step 2: Prepare the order payload
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
                        design_code: item.designCode,
                        width_inches: "",
                        height_inches: "",
                        placement_sku: "",
                        design_link: "",
                        mockup_link: ""
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

        // Step 3: Create the order using the bearer token
        const orderResponse = await fetch('https://sandbox.qikink.com/api/order/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(qikinkOrderPayload),
        });

        const result = await orderResponse.json();

        if (!orderResponse.ok || result.status_code !== 200) {
            const errorMessage = `Qikink API Error: ${result.message || 'Unknown error.'} Details: ${JSON.stringify(result.errors || result)}`;
            return { success: false, error: errorMessage };
        }
        
        // Step 4: Save order to Firestore
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
        return { success: false, error: "An unexpected error occurred while communicating with the fulfillment provider." };
    }
}
