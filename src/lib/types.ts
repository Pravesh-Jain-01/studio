
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
