"use server";

const QIKINK_API_KEY = process.env.QIKINK_API_KEY || '814276779348448';
const QIKINK_API_SECRET = process.env.QIKINK_API_SECRET || 'f2b956c12481492e255a85b5107b6229abf9be2a3460a9e4337982e75ab0cff0';

interface QikinkAuthResult {
    success: boolean;
    accessToken?: string;
    error?: string;
}

/**
 * A common function to retrieve an access token from the Qikink API.
 * This should be used before making any other API calls to Qikink.
 * It caches the token for one hour to improve performance.
 */
export async function getQikinkAccessToken(): Promise<QikinkAuthResult> {
    if (!QIKINK_API_KEY || !QIKINK_API_SECRET) {
        const errorMsg = "Server configuration error: Fulfillment provider API credentials are not set.";
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        const tokenResponse = await fetch('https://sandbox.qikink.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              ClientId: QIKINK_API_KEY,
              client_secret: QIKINK_API_SECRET,
            }).toString(),
            // Cache the token for 1 hour to avoid re-fetching on every request.
            next: { revalidate: 3600 } 
        });
          
        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.Accesstoken) {
            const authError = `Qikink Auth Failed: ${tokenData.message || 'Could not retrieve access token.'}`;
            console.error(authError, tokenData);
            return { success: false, error: authError };
        }
        
        return { success: true, accessToken: tokenData.Accesstoken };

    } catch (error: any) {
        const errorMsg = "An unexpected error occurred during Qikink authentication.";
        console.error(errorMsg, error);
        return { success: false, error: errorMsg };
    }
}
