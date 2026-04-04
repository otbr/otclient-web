import { SPRITE_SIZE } from './spr';
import type { SprFile } from './spr';
import { decodeSprite } from './spr';

/** Maximum atlas texture dimension (most GPUs support at least 2048). */
export const ATLAS_SIZE = 2048;

/** Number of sprites per row/column in one atlas page. */
export const SPRITES_PER_ROW = ATLAS_SIZE / SPRITE_SIZE; // 64

/** Number of sprites that fit in one atlas page. */
export const SPRITES_PER_PAGE = SPRITES_PER_ROW * SPRITES_PER_ROW; // 4096

export interface SpriteLocation {
  page: number;
  x: number;
  y: number;
}

/**
 * Compute atlas page, x, y for every sprite ID (1-based).
 * Returns a Map from spriteId → SpriteLocation.
 */
export function computeAtlasLayout(spriteCount: number): Map<number, SpriteLocation> {
  const layout = new Map<number, SpriteLocation>();
  for (let i = 0; i < spriteCount; i++) {
    const spriteId = i + 1;
    const page = Math.floor(i / SPRITES_PER_PAGE);
    const indexInPage = i % SPRITES_PER_PAGE;
    const col = indexInPage % SPRITES_PER_ROW;
    const row = Math.floor(indexInPage / SPRITES_PER_ROW);
    layout.set(spriteId, {
      page,
      x: col * SPRITE_SIZE,
      y: row * SPRITE_SIZE,
    });
  }
  return layout;
}

/**
 * Build atlas page RGBA buffers by decoding all sprites and packing them.
 * Returns an array of Uint8Array pages (each ATLAS_SIZE x ATLAS_SIZE x 4 bytes).
 */
export function buildAtlasPages(spr: SprFile): Uint8Array[] {
  const pageCount = Math.ceil(spr.spriteCount / SPRITES_PER_PAGE);
  const pageByteSize = ATLAS_SIZE * ATLAS_SIZE * 4;
  const pages: Uint8Array[] = [];
  for (let p = 0; p < pageCount; p++) {
    pages.push(new Uint8Array(pageByteSize));
  }

  const layout = computeAtlasLayout(spr.spriteCount);

  for (let spriteId = 1; spriteId <= spr.spriteCount; spriteId++) {
    const rgba = decodeSprite(spr, spriteId);
    if (!rgba) continue;

    const loc = layout.get(spriteId)!;
    const page = pages[loc.page];

    // Copy 32x32 sprite into atlas page row by row
    for (let row = 0; row < SPRITE_SIZE; row++) {
      const srcOffset = row * SPRITE_SIZE * 4;
      const dstOffset = ((loc.y + row) * ATLAS_SIZE + loc.x) * 4;
      page.set(rgba.subarray(srcOffset, srcOffset + SPRITE_SIZE * 4), dstOffset);
    }
  }

  return pages;
}
