import { MMIODevice } from ".";
import { MemoryAccessWidth } from "../pipeline/memory-access";

export const RAMSize = 1024 * 1024 * 4;

export class RAMDevice implements MMIODevice {
    private ram = new Uint32Array(RAMSize / 4);

    read(address: number, width: MemoryAccessWidth): number {
        const addr = address >>> 2;
        const offset = address & 0b11;
        const value = this.ram[addr & ((RAMSize/4)-1)];

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
    write(address: number, value: number, width: MemoryAccessWidth): void {
        const addr = address >>> 2;
        const maskedAddress = addr & ((RAMSize/4)-1);
        const offset = address & 0b11;
        const currentValue = this.ram[maskedAddress];

        switch (width) {
            case MemoryAccessWidth.Byte: {
                switch (offset) {
                    case 0b00: this.ram[maskedAddress] = (currentValue & 0x00ffffff) | (value << 24); break;
                    case 0b01: this.ram[maskedAddress] = (currentValue & 0xff00ffff) | (value << 16); break;
                    case 0b10: this.ram[maskedAddress] = (currentValue & 0xffff00ff) | (value << 8); break;
                    case 0b11: this.ram[maskedAddress] = (currentValue & 0xffffff00) | (value << 0); break;
                }
                break;
            }

            case MemoryAccessWidth.HalfWord: {
                switch (offset) {
                    case 0b00: this.ram[maskedAddress] = (currentValue & 0x0000ffff) | (value << 16); break;
                    case 0b01: this.ram[maskedAddress] = (currentValue & 0xffff0000) | (value << 0); break;
                }
                break;
            }

            case MemoryAccessWidth.Word: {
                this.ram[maskedAddress] = value;
            }
        }
    }

}