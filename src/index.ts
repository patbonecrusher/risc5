import { SystemInterface } from "./system-interface";
import { RAMDevice } from "./system-interface/ram";
import { ROMDevice } from "./system-interface/rom";
import { toHexString } from "./utils";
import { InstructionFetch } from "./pipeline/fetch";
import { Decode } from "./pipeline/decode";

enum State {
    InstructionFetch,
    Decode,
    Execute,
    MemoryAccess,
    WriteBack
}

class RVI32System {
    state = State.InstructionFetch;

    rom = new ROMDevice();
    ram = new RAMDevice();
    regFile = Array.from({ length: 32 }, () => new Register32());

    bus = new SystemInterface(this.rom, this.ram);

    IF = new InstructionFetch({
        shouldStall: () => this.state !== State.InstructionFetch,
        bus: this.bus,
    });

    DE = new Decode({
        shouldStall: () => this.state !== State.Decode,
        getInstructionIn: () => this.IF.getInstructionOut(),
        regFile: this.regFile,
    });

    EX = new Execute({
        shouldStall: () => this.state !== State.Execute,
        getDecodedValuesIn: () => this.DE.getDecodedValuesOut()
    });

    MEM = new MemoryAccess({
        shouldStall: () => this.state !== State.MemoryAccess,
        getExecutionValuesIn: () => this.EX.getExecutionValuesOut()
    });

    WB = new WriteBack({
        shouldStall: () => this.state !== State.WriteBack,
        getMemoryValuesIn: () => this.MEM.getMemoryAccessOut(),
        regFile: this.regFile
    })

    compute() {
        this.IF.compute();
        this.DE.compute();
        this.EX.compute();
        this.MEM.compute();
        this.WB.compute();
    }

    latchNext() {
        this.IF.latchNext();
        this.DE.latchNext();
        this.EX.latchNext();
        this.MEM.latchNext();
        this.WB.latchNext();
    }

    cycle() {
        this.compute();
        this.latchNext();
        switch (this.state) {
            case State.InstructionFetch: { this.state = State.Decode; break; }
            case State.Decode: { this.state = State.Execute; break; }
            case State.Execute: { this.state = State.MemoryAccess; break; }
            case State.MemoryAccess: { this.state = State.WriteBack; break; }
            case State.WriteBack: { this.state = State.InstructionFetch; break; }
        }
    }
}


import { Either } from 'monet';
import { Register32 } from "./register32";
import { Execute } from "./pipeline/execute";
import { MemoryAccess } from "./pipeline/memory-access";
import { WriteBack } from "./pipeline/write-back";

const rv = new RVI32System();
rv.regFile[1].value = 0x01020304;
rv.regFile[2].value = 0x02030405;

rv.regFile[11].value = 0x80000000;
rv.regFile[12].value = 0x00000001;


rv.rom.load(new Uint32Array([
    // 0b111111111111_00001_000_00110_0010011, // ADDI -1, r1, r6
    // 0b000000000001_00001_000_00011_0010011, // ADDI 1, r1, r3
    // 0b0000000_00001_00010_000_00100_0110011, // ADD r1, r2, r4
    // 0b0100000_00001_00010_000_00101_0110011, // SUB r1, r2, r4
    //0000000 rs2   rs1   fun rd    
    0b0000000_01100_01011_101_01101_0110011, // SLL
    0b0100000_01100_01011_101_10000_0110011, // SLL
]))

for (let i=0; i<1000; ++i) {
    rv.cycle();
}
console.log(rv.regFile[1].value.toString(16));
console.log(rv.regFile[2].value.toString(16));
console.log(rv.regFile[3].value.toString(16));
console.log(rv.regFile[4].value.toString(16));
console.log(rv.regFile[5].value.toString(16));
console.log(rv.regFile[6].value.toString(16));
console.log(rv.regFile[11].value.toString(2).padStart(32, '0'));
console.log(rv.regFile[13].value.toString(2).padStart(32, '0'));
console.log(rv.regFile[16].value.toString(2).padStart(32, '0'));


// while (true) {
//     rv.cycle();
//}

// const rv = new RVI32System();

// rv.rom.load(new Uint32Array([
//     0xdeadbeef,
//     0xcafebabe 
// ]));


// function safeRead(address: number): Either<string, string> {
//     try {
//         return Either.Right(toHexString(rv.bus.read(address)));
//     } catch (error) {
//         return Either.Left(error.toString());
//     }
// }

// console.log(safeRead(0x10000000).right());
// console.log(safeRead(0x10000004).right());
// console.log(safeRead(0x10000005).left());


// rv.bus.write(0x20000000, 0x01020304);
// console.log(toHexString(rv.bus.read(0x20000000)));

// rv.bus.write(0x20400000, 0x01020304);
// console.log(toHexString(rv.bus.read(0x20000000)));
