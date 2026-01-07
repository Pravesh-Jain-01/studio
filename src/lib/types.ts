
export type ProductVariant = {
  id: string;
  fit: 'oversized' | 'regular';
  color: 'beige' | 'white' | 'black';
  size: 's' | 'm' | 'l' | 'xl' | 'xxl';
  price: number;
  stock: number;
};

export type Product = {
  id?: string; // Firestore document ID
  slug: string;
  quote: string;
  imageId: string;
  description: string;
  details: {
    fit: string;
    fabric: string;
    feel: string;
  };
  collection: 'drop-01';
  variants: ProductVariant[];
};
