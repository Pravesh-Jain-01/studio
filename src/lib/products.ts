import type { Product } from './types';

const productDescription = "for the ones who feel deeply.\nsoft fabric, relaxed fit, everyday comfort.\nmade for slow days, late nights & honest hearts.";
const productDetails = {
  fit: 'unisex',
  fabric: 'soft cotton',
  feel: 'breathable, gentle on skin',
};

// This data is now just for fallback or initial seeding. Products will be fetched from Firestore.
export const products: Product[] = [
  // This data is no longer the source of truth.
  // It is kept here for reference or as a fallback if needed.
  // All product data is now managed in Firestore.
];
