/**
 * Utility functions for converting item names to URL-friendly slugs
 */

/**
 * Convert item name to URL-friendly slug
 * Example: "Rune platebody (g)" -> "rune-platebody-g"
 */
export const itemNameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[()]/g, '') // Remove parentheses
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Convert slug back to searchable format (for API queries)
 * Note: This won't perfectly recreate the original name, but close enough for search
 * Example: "rune-platebody-g" -> "rune platebody g"
 */
export const slugToSearchTerm = (slug: string): string => {
  return slug.replace(/-/g, ' ');
};

/**
 * Generate item URL with slug
 */
export const getItemUrl = (itemId: number, itemName: string): string => {
  const slug = itemNameToSlug(itemName);
  return `/items/${itemId}/${slug}`;
};
