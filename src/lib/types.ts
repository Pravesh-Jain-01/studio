export type Product = {
  id?: string; // Made optional for creating new products before they have a Firestore ID
  slug: string;
  quote: string;
  fit: 'oversized' | 'regular';
  color: 'beige' | 'white' | 'black';
  price: number;
  imageId: string;
  description: string;
  details: {
    fit: string;
    fabric: string;
    feel: string;
  };
  collection: 'drop-01';
};
