
"use server";

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

    const QIKINK_API_KEY = process.env.QIKINK_API_KEY || '814276779348448';
    const QIKINK_API_SECRET = process.env.QIKINK_API_SECRET || 'f2b956c12481492e255a85b5107b6229abf9be2a3460a9e4337982e75ab0cff0';

    if (!QIKINK_API_KEY || !QIKINK_API_SECRET) {
        return { success: false, error: "Server configuration error: Fulfillment provider API credentials are not set." };
    }

    try {
        // Step 1: Get Access Token
        const tokenResponse = await fetch('https://sandbox.qikink.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              ClientId: QIKINK_API_KEY,
              client_secret: QIKINK_API_SECRET,
            }).toString(),
          });
          
        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.Accesstoken) {
            const authError = `Qikink Auth Failed: ${tokenData.message || 'Could not retrieve access token.'}`;
            return { success: false, error: authError };
        }
        
        const accessToken = tokenData.Accesstoken;
        
        // Step 2: Build the order payload
        const [firstName, ...lastNameParts] = shippingDetails.name.split(' ');
        const lastName = lastNameParts.join(' ') || firstName;

        const qikinkOrderPayload = {
            order_number: `ss${userId.slice(0, 4)}${Date.now().toString().slice(-9)}`,
            qikink_shipping: "1",
            gateway: "COD",
            total_order_value: subtotal.toString(),
            line_items: cart.map(item => ({
                search_from_my_products: 0,
                quantity: item.quantity.toString(),
                price: item.price.toString(),
                print_type_id: "1",
                sku: item.baseSku,
                designs: [
                    {
                        design_code: item.designCode,
                        width_inches: "",
                        height_inches: "",
                        placement_sku: "fr",
                        design_link: item.mockupLink || "",
                        mockup_link: item.mockupLink || ""
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

        // Step 3: Create the order
        const orderResponse = await fetch('https://sandbox.qikink.com/api/order/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ClientId': QIKINK_API_KEY,
              'Accesstoken': accessToken,
            },
            body: JSON.stringify(qikinkOrderPayload),
        });

        const result = await orderResponse.json();

        // Check for failure (API returns 200 OK but with error message sometimes)
        if (!orderResponse.ok || String(result.status_code) !== '200') {
            const errorMessage = `Qikink API Error: ${result.message || 'Unknown error.'} Details: ${JSON.stringify(result.errors || result)}`;
            return { success: false, error: errorMessage };
        }
        
        const qikinkOrderId = result.order_id;
        
        if (!qikinkOrderId) {
            const errorMessage = `Qikink API Error: Order created successfully but no Order ID was returned. Details: ${JSON.stringify(result)}`;
            return { success: false, error: errorMessage };
        }

        return { success: true, qikinkOrderId };

    } catch (error: any) {
        return { success: false, error: "An unexpected error occurred while communicating with the fulfillment provider." };
    }
}
