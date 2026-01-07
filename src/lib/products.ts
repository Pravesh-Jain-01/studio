import type { Product } from './types';

const productDescription = "for the ones who feel deeply.\nsoft fabric, relaxed fit, everyday comfort.\nmade for slow days, late nights & honest hearts.";
const productDetails = {
  fit: 'unisex',
  fabric: 'soft cotton',
  feel: 'breathable, gentle on skin',
};

// This data is now just for fallback or initial seeding. Products will be fetched from Firestore.
export const products: Product[] = [
  {
    id: '1',
    slug: 'dil-soft-intentions-clear',
    quote: 'dil soft, intentions clear',
    imageId: 'dil-soft-beige',
    description: productDescription,
    details: productDetails,
    collection: 'drop-01',
    variants: [
        { id: '1-reg-bei-m', fit: 'regular', color: 'beige', size: 'm', price: 899, stock: 10 },
        { id: '1-over-bei-m', fit: 'oversized', color: 'beige', size: 'm', price: 999, stock: 5 },
    ]
  },
  {
    id: '2',
    slug: 'thoda-pyar-more-peace',
    quote: 'थोड़ा प्यार, more peace',
    imageId: 'pyar-peace-white',
    description: productDescription,
    details: productDetails,
    collection: 'drop-01',
    variants: [
        { id: '2-reg-whi-l', fit: 'regular', color: 'white', size: 'l', price: 899, stock: 15 },
    ]
  },
  {
    id: '3',
    slug: 'healing-ho-rahi-hai',
    quote: 'healing हो रही है, slowly',
    imageId: 'healing-black',
    description: productDescription,
    details: productDetails,
    collection: 'drop-01',
     variants: [
        { id: '3-over-blk-xl', fit: 'oversized', color: 'black', size: 'xl', price: 1049, stock: 8 },
    ]
  },
  {
    id: '4',
    slug: 'bas-ehsaas-no-pressure',
    quote: 'bas ehsaas, no pressure',
    imageId: 'bas-ehsaas-beige',
    description: productDescription,
    details: productDetails,
    collection: 'drop-01',
     variants: [
        { id: '4-reg-bei-s', fit: 'regular', color: 'beige', size: 's', price: 899, stock: 12 },
    ]
  },
  {
    id: '5',
    slug: 'soft-hoon-stand-ground',
    quote: 'soft hoon, but I stand my ground',
    imageId: 'soft-hoon-white',
    description: productDescription,
    details: productDetails,
    collection: 'drop-01',
     variants: [
        { id: '5-over-whi-m', fit: 'oversized', color: 'white', size: 'm', price: 999, stock: 0 },
    ]
  },
  {
    id: '6',
    slug: 'dil-naram-boundaries-strong',
    quote: 'दिल नरम है, boundaries strong',
    imageId: 'dil-naram-black',
    description: productDescription,
    details: productDetails,
    collection: 'drop-01',
    variants: [
        { id: '6-reg-blk-l', fit: 'regular', color: 'black', size: 'l', price: 899, stock: 20 },
    ]
  },
];
