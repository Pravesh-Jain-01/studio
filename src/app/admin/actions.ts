
'use server';

import { getQikinkAccessToken } from "@/lib/qikink";
import { QikinkOrder } from "@/lib/types";

export async function getQikinkOrders(): Promise<{ success: boolean; orders?: QikinkOrder[]; error?: string; }> {
    const authResult = await getQikinkAccessToken();

    if (!authResult.success || !authResult.accessToken) {
        return { success: false, error: authResult.error };
    }

    const { accessToken } = authResult;
    const QIKINK_API_KEY = process.env.QIKINK_API_KEY || '814276779348448';

    try {
        const response = await fetch('https://sandbox.qikink.com/api/order', {
            method: 'GET',
            headers: {
                'ClientId': QIKINK_API_KEY,
                'Accesstoken': accessToken,
            },
            // Cache for 60 seconds to prevent hitting the API on every navigation
            next: { revalidate: 60 } 
        });

        if (!response.ok) {
            const errorText = await response.text();
            const errorMessage = `Qikink API Error: ${response.status} ${response.statusText}. Details: ${errorText}`;
            console.error(errorMessage);
            return { success: false, error: errorMessage };
        }

        const orders: QikinkOrder[] = await response.json();
        
        // Sort orders to show the most recent ones first
        orders.sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime());

        return { success: true, orders };

    } catch (error: any) {
        console.error("Failed to fetch Qikink orders:", error);
        return { success: false, error: "An unexpected error occurred while fetching orders from the fulfillment provider." };
    }
}
