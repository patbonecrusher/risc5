import { Register32 } from "../register32";
import { MemoryMap, SystemInterface } from "../system-interface";
import { PipelineStage } from "./pipeline-stage";

export interface InstructionFetchParams {
    bus: SystemInterface;
    shouldStall: () => boolean;
}

export class InstructionFetch extends PipelineStage {
    private pc = new Register32(MemoryMap.ProgramROMStart);
    private pcNext = new Register32(MemoryMap.ProgramROMStart);

    private instruction = new Register32(0);
    private instructionNext = new Register32(0);

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
            this.instructionNext.value = this.bus.read(address);
            this.pcNext.value += 4;
        }
    }

    latchNext(): void {
        this.instruction.value = this.instructionNext.value;
        this.pc.value = this.pcNext.value;
    }

    getInstructionOut(): number {
        return this.instruction.value;
    }
}