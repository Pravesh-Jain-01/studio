
import { imagePlaceholders } from './placeholder-images.json';

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

    const variantImages: PlaceholderImage[] = [];
    for (let i = 1; i <= 4; i++) {
        const imageId = `${baseId.slice(0, -2)}-${i}`;
        if (isPlaceholderKey(imageId)) {
            variantImages.push(imagePlaceholders[imageId]);
        }
    }

    // If no specific variant images were found, return the base image or a default
    if (variantImages.length === 0) {
         if (isPlaceholderKey(baseId)) {
            return [imagePlaceholders[baseId]];
        }
        return [imagePlaceholders['default-placeholder']];
    }

    return variantImages;
}

export { imagePlaceholders };
