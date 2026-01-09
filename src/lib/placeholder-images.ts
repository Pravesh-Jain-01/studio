
import imageData from './placeholder-images.json';

// Type assertion to ensure imageData is treated with the correct structure
const imagePlaceholders = imageData as Record<string, PlaceholderImage>;

export type PlaceholderImage = {
    url: string;
    width: number;
    height: number;
    description: string;
};

// A type guard to check if a key exists in the imagePlaceholders object
function isPlaceholderKey(key: string | null | undefined): key is keyof typeof imagePlaceholders {
    if (!key) return false;
    return key in imagePlaceholders;
}

export function getPlaceholderImage(id: string | null | undefined): PlaceholderImage {
    if (isPlaceholderKey(id)) {
        return imagePlaceholders[id];
    }
    // Return a default/fallback image if the ID is not found
    return imagePlaceholders['default-placeholder'];
}

export function getPlaceholderImagesForVariant(baseId: string | null | undefined): PlaceholderImage[] {
    if (!baseId) return [getPlaceholderImage('default-placeholder')];

    // The baseId might have a suffix like `-1`, `-2`. We want to find all images with the same prefix.
    const prefix = baseId.slice(0, baseId.lastIndexOf('-'));
    const variantImages: PlaceholderImage[] = [];
    
    // Find all images that start with the same prefix (e.g., 'regular-white')
    for (const key in imagePlaceholders) {
        if (key.startsWith(prefix)) {
            variantImages.push(imagePlaceholders[key]);
        }
    }

    // If no specific variant images were found, return the base image or a default
    if (variantImages.length > 0) {
        return variantImages;
    }
    
    if (isPlaceholderKey(baseId)) {
        return [imagePlaceholders[baseId]];
    }

    return [imagePlaceholders['default-placeholder']];
}

export { imagePlaceholders };
