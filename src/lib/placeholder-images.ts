
import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

export const placeholderImageMap = new Map<string, ImagePlaceholder>(
    PlaceHolderImages.map(img => [img.id, img])
);

/**
 * Utility to resolve an image source.
 * Handles both placeholder IDs and full external URLs.
 */
export const getImageUrl = (idOrUrl: string | undefined): string => {
  if (!idOrUrl) return 'https://picsum.photos/seed/zapizza/600/400';
  
  // If it's a URL (starts with http or data:), return it directly
  if (idOrUrl.startsWith('http') || idOrUrl.startsWith('data:')) {
    return idOrUrl;
  }

  // Otherwise, lookup in the placeholder map
  return placeholderImageMap.get(idOrUrl)?.imageUrl || 'https://picsum.photos/seed/zapizza/600/400';
};
