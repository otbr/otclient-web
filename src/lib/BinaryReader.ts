export class BinaryReader {
  private view: DataView;
  private offset: number;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
    this.offset = 0;
  }

  get position(): number {
    return this.offset;
  }

  get length(): number {
    return this.view.byteLength;
  }

  getU8(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  getU16(): number {
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  getU32(): number {
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }

  getString(): string {
    const len = this.getU16();
    const bytes = new Uint8Array(this.view.buffer, this.offset, len);
    this.offset += len;
    return new TextDecoder().decode(bytes);
  }

  skip(bytes: number): void {
    this.offset += bytes;
  }
}
