
export type ProductVariant = {
  id: string;
  fit: 'oversized' | 'regular';
  color: 'beige' | 'white' | 'black';
  size: 's' | 'm' | 'l' | 'xl' | 'xxl';
  price: number;
  stock: number;
  imageId: string;
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
  collection: 'drop-01';
  variants: ProductVariant[];
};
