
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

export { imagePlaceholders };
