import { MMIODevice } from ".";
import { MemoryAccessWidth } from "../pipeline/memory-access";

export const ROMSize = 1024 * 1024;

export class ROMDevice implements MMIODevice {
    private rom = new Uint32Array(ROMSize / 4);

    read(address: number, width: MemoryAccessWidth): number {
        const addr = address >>> 2;
        const offset = address & 0b11;
        const value = this.rom[addr & ((ROMSize/4)-1)];

        switch (width) {
            case MemoryAccessWidth.Byte: {
                switch (offset) {
                    case 0b00: return (value & 0xff000000) >>> 24;
                    case 0b01: return (value & 0x00ff0000) >>> 16;
                    case 0b10: return (value & 0x0000ff00) >>> 8;
                    case 0b11: return (value & 0x000000ff) >>> 0;
                }
                break;
            }

            case MemoryAccessWidth.HalfWord: {
                switch (offset) {
                    case 0b00: return (value & 0xffff0000) >>> 16;
                    case 0b01: return (value & 0x0000ffff) >>> 0;
                }
                break;
            }

            case MemoryAccessWidth.Word: {
                return value;
            }
        }
    }

    write(address: number, value: number): void {
        // Do nothing, you can't write to ROM
    }

    load(data: Uint32Array) {
        for (let i=0; i<(ROMSize/4); i++) {
            if (i>=data.length) {
                this.rom[i] = 0xffffffff;
            } else {
                this.rom[i] = data[i];
            }
        }
    }
}