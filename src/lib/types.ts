
export type ProductVariant = {
  id: string;
  fit: 'oversized' | 'regular';
  color: 'beige' | 'white' | 'black' | 'navy-blue';
  size: 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';
  price: number;
  stock: number;
  imageUrl: string;
  qikinkSku: string;
  designCode: string;
  mockupLink?: string;
};

export type Product = {
  id?: string; // Firestore document ID
  quote: string;
  description: string;
  details: {
    fit: string;
    fabric: string;
    feel: string;
  };
  collection: string;
  variants: ProductVariant[];
};

export interface CartItem {
  productId: string;
  variantId: string;
  quote: string;
  imageUrl: string;
  price: number;
  fit: ProductVariant['fit'];
  color: ProductVariant['color'];
  size: ProductVariant['size'];
  quantity: number;
  qikinkSku: string;
  designCode: string;
  mockupLink?: string;
}

// Types for Qikink API response
export interface QikinkShipping {
    first_name: string;
    last_name: string | null;
    phone: string;
    email: string | null;
    city: string;
    zip: string;
    province: string | null;
    country_code: string | null;
    awb: string | null;
    tracking_link: string | null;
}

export interface QikinkDesign {
    design_code: string;
    placement: string;
    height_inches: string;
    width_inches: string;
    design_url: string;
    mockup_url: string | null;
}

export interface QikinkLineItem {
    sku: string;
    quantity: string;
    price: string;
    designs: QikinkDesign[];
}

export interface QikinkOrder {
    order_id: number;
    number: string;
    created_on: string; // e.g., "2023-05-29 01:10:04"
    live_date: string;
    status: string;
    shipping_type: string;
    payment_type: string;
    total_order_value: string;
    shipping: QikinkShipping;
    line_items: QikinkLineItem[];
}
