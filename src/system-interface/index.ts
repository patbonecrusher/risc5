import { toHexString } from "../utils";
import { RAMDevice } from "./ram";
import { ROMDevice } from "./rom";

export interface MMIODevice {
    read(address: number): number;
    write(address: number, value: number): void;
}

export enum MemoryMap {
    ProgramROMStart = 0x10000000,
    ProgramROMEnd   = 0x1fffffff,
    RAMStart        = 0x20000000,
    RAMEnd          = 0x2fffffff
}

export class SystemInterface implements MMIODevice {
    private rom: ROMDevice
    private ram: RAMDevice
    
    constructor(rom: ROMDevice, ram: RAMDevice) {
        this.rom = rom;
        this.ram = ram;
    }

    read(address: number): number {
        // check alignment.  throw up for now
        if ((address & 0b11) !== 0) {
            throw new Error(`Unaligned read from address 0x${toHexString(address)}`)
        }

        if ((address & MemoryMap.ProgramROMStart) === MemoryMap.ProgramROMStart) {
            // Why shifting 2 bits? to 4 byte align?
            return this.rom.read((address & 0x0fffffff) >> 2);
        }

        if ((address & MemoryMap.RAMStart) === MemoryMap.RAMStart) {
            // Why shifting 2 bits? to 4 byte align?
            return this.ram.read((address & 0x0fffffff) >> 2);
        }

        return 0;
    }
    write(address: number, value: number): void {
        if ((address & 0b11) !== 0) {
            throw new Error(`Unaligned read from address 0x${toHexString(address)} (value=0x${toHexString(value)})`)
        }

        if ((address & MemoryMap.RAMStart) === MemoryMap.RAMStart) {
            // Why shifting 2 bits? to 4 byte align?
            return this.ram.write((address & 0x0fffffff) >> 2, value);
        }
    }
}