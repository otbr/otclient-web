import { describe, it, expect } from 'vitest';
import {
  computeAtlasLayout,
  buildAtlasPages,
  ATLAS_SIZE,
  SPRITES_PER_ROW,
  SPRITES_PER_PAGE,
} from '../lib/atlas';
import { SPRITE_SIZE, parseSpr } from '../lib/spr';

function pushU16(bytes: number[], value: number) {
  bytes.push(value & 0xff, (value >> 8) & 0xff);
}

function pushU32(bytes: number[], value: number) {
  bytes.push(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
}

/** Build a .spr with N sprites, each a single colored pixel at position 0. */
function buildTestSpr(count: number, color: [number, number, number] = [255, 0, 0]): ArrayBuffer {
  const bytes: number[] = [];
  pushU32(bytes, 0); // signature
  pushU16(bytes, count);

  const offsetTableStart = bytes.length;
  for (let i = 0; i < count; i++) {
    pushU32(bytes, 0); // placeholder
  }

  for (let i = 0; i < count; i++) {
    const offset = bytes.length;
    bytes[offsetTableStart + i * 4] = offset & 0xff;
    bytes[offsetTableStart + i * 4 + 1] = (offset >> 8) & 0xff;
    bytes[offsetTableStart + i * 4 + 2] = (offset >> 16) & 0xff;
    bytes[offsetTableStart + i * 4 + 3] = (offset >> 24) & 0xff;

    // Color key
    bytes.push(0xff, 0x00, 0xff);

    // Pixel data: 0 transparent, 1 colored pixel
    const pixelData: number[] = [];
    pushU16(pixelData, 0); // transparent count
    pushU16(pixelData, 1); // colored count
    pixelData.push(color[0], color[1], color[2]);

    pushU16(bytes, pixelData.length);
    bytes.push(...pixelData);
  }

  return new Uint8Array(bytes).buffer;
}

describe('computeAtlasLayout', () => {
  it('places first sprite at page 0, position (0, 0)', () => {
    const layout = computeAtlasLayout(1);
    expect(layout.get(1)).toEqual({ page: 0, x: 0, y: 0 });
  });

  it('places sprites left-to-right then top-to-bottom', () => {
    const layout = computeAtlasLayout(SPRITES_PER_ROW + 1);
    // Second sprite is at column 1
    expect(layout.get(2)).toEqual({ page: 0, x: SPRITE_SIZE, y: 0 });
    // First sprite of second row
    expect(layout.get(SPRITES_PER_ROW + 1)).toEqual({ page: 0, x: 0, y: SPRITE_SIZE });
  });

  it('overflows to second page after filling first', () => {
    const layout = computeAtlasLayout(SPRITES_PER_PAGE + 1);
    const last = layout.get(SPRITES_PER_PAGE)!;
    expect(last.page).toBe(0);

    const overflow = layout.get(SPRITES_PER_PAGE + 1)!;
    expect(overflow.page).toBe(1);
    expect(overflow.x).toBe(0);
    expect(overflow.y).toBe(0);
  });
});

describe('buildAtlasPages', () => {
  it('creates correct number of pages', () => {
    const spr = parseSpr(buildTestSpr(1));
    const pages = buildAtlasPages(spr);
    expect(pages).toHaveLength(1);
    expect(pages[0].length).toBe(ATLAS_SIZE * ATLAS_SIZE * 4);
  });

  it('places sprite pixel data at correct position', () => {
    const spr = parseSpr(buildTestSpr(1, [0, 255, 0]));
    const pages = buildAtlasPages(spr);
    // Sprite 1 at (0,0), pixel 0,0 should be green
    expect(pages[0][0]).toBe(0);   // R
    expect(pages[0][1]).toBe(255); // G
    expect(pages[0][2]).toBe(0);   // B
    expect(pages[0][3]).toBe(255); // A
  });

  it('places second sprite at correct atlas offset', () => {
    const spr = parseSpr(buildTestSpr(2, [0, 0, 255]));
    const pages = buildAtlasPages(spr);
    // Sprite 2 at (32, 0) → byte offset = (0 * ATLAS_SIZE + 32) * 4
    const off = 32 * 4;
    expect(pages[0][off]).toBe(0);     // R
    expect(pages[0][off + 1]).toBe(0); // G
    expect(pages[0][off + 2]).toBe(255); // B
    expect(pages[0][off + 3]).toBe(255); // A
  });
});
