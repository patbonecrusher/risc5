import { Register32 } from "../register32";
import { MemoryMap, SystemInterface } from "../system-interface";
import { MemoryAccessWidth } from "./memory-access";
import { PipelineStage } from "./pipeline-stage";

export interface InstructionFetchParams {
    bus: SystemInterface;
    shouldStall: () => boolean;
}

export class InstructionFetch extends PipelineStage {
    private pc = new Register32(MemoryMap.ProgramROMStart);

    private instruction = new Register32(0);

    private bus: SystemInterface;
    private shouldStall: () => boolean;

    constructor(params: InstructionFetchParams) {
        super();
        this.bus = params.bus;
        this.shouldStall = params.shouldStall;
    }

    compute(): void {
        if (!this.shouldStall()) {
            const address = this.pc.value;
            this.instruction.value = this.bus.read(address, MemoryAccessWidth.Word);
            this.pc.value += 4;
        }
    }

    latchNext(): void {
        this.instruction.latchNext();
        this.pc.latchNext();
    }

    getInstructionOut(): number {
        return this.instruction.value;
    }
}