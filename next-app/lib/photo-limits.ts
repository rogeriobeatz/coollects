/** Strict per-photo transfer/storage budget: 600 decimal KB (600,000 bytes). */
export const MAX_PHOTO_BYTES = 600_000
/** Maximum original camera file accepted before client-side compression. */
export const MAX_SOURCE_PHOTO_BYTES = 32 * 1024 * 1024
/** Balanced resolution for collectibles, packaging text and mobile viewing. */
export const MAX_PHOTO_EDGE = 1600
/** Main photo (analyzed by AI) plus up to 4 extra gallery photos per item. */
export const MAX_ITEM_PHOTOS = 5
