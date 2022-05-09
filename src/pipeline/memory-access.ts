import { Register32 } from "../register32";
import { Execute } from "./execute";
import { PipelineStage } from "./pipeline-stage";
import { boolToInt, signExtend32, toHexString, twos, untwos } from "../utils";
import { SystemInterface } from "../system-interface";

export interface MemoryAccessParams {
    shouldStall: () => boolean;
    getExecutionValuesIn: () => ReturnType<Execute['getExecutionValuesOut']>;
    bus: SystemInterface;
}

export enum MemoryAccessWidth {
    Byte        = 0b000,
    HalfWord    = 0b001, 
    Word        = 0b010,
}

export class MemoryAccess extends PipelineStage {

    private shouldStall: MemoryAccessParams['shouldStall'];
    private getExecutionValuesIn: MemoryAccessParams['getExecutionValuesIn'];
    private bus: MemoryAccessParams['bus'];

    private writebackValue = new Register32(0);
    private rd = new Register32(0);
    private isAluOperation = new Register32(0);
    private isLoad = new Register32(0);
    private isLUI = new Register32(0);

    constructor(params: MemoryAccessParams) {
        super();
        this.shouldStall = params.shouldStall;
        this.getExecutionValuesIn = params.getExecutionValuesIn;
        this.bus = params.bus;
    }

    compute(): void {
        if (!this.shouldStall()) {
            const {aluResult, rd, isAluOperation, isStore, imm32, rs1, rs2, funct3, isLoad, isLUI} = this.getExecutionValuesIn();
            this.writebackValue.value = aluResult;
            this.rd.value = rd;
            this.isAluOperation.value = isAluOperation;
            this.isLoad.value = isLoad;
            this.isLUI.value = isLUI;

            // TODO: This should be done in the ALU
            const addr = twos(imm32 + rs1);

            if (isStore) {
                switch (funct3) {
                    // should trap if funct3 is invalid.
                    case MemoryAccessWidth.Byte:
                        this.bus.write(addr, rs2 & 0xff, MemoryAccessWidth.Byte);
                        break;
                    case MemoryAccessWidth.HalfWord:
                        this.bus.write(addr, rs2 & 0xffff, MemoryAccessWidth.HalfWord);
                        break;
                    case MemoryAccessWidth.Word:
                        this.bus.write(addr, rs2 & 0xffffffff, MemoryAccessWidth.Word);
                        break;
                }
            } else if (isLoad) {
                const shouldSignExtend = (funct3 & 0b100) === 0;
                let value: number;
                switch (funct3 & 0b011) {
                    // should trap if funct3 is invalid.
                    case MemoryAccessWidth.Byte:
                        value = this.bus.read(addr, MemoryAccessWidth.Byte);
                        value = shouldSignExtend ? value = signExtend32(8, value) : value;    
                        break;
                    case MemoryAccessWidth.HalfWord:
                        value = this.bus.read(addr, MemoryAccessWidth.HalfWord);
                        value = shouldSignExtend ? value = signExtend32(16, value) : value;    
                        break;
                    case MemoryAccessWidth.Word:
                        value = this.bus.read(addr, MemoryAccessWidth.Word);
                        value = value;    
                        break;
                }

                this.writebackValue.value = value;
            } else if (isLUI) {
                this.writebackValue.value = imm32;
            }
        }
    }

    latchNext(): void {
        this.writebackValue.latchNext();
        this.rd.latchNext();
        this.isAluOperation.latchNext();
        this.isLoad.latchNext();
        this.isLUI.latchNext();
    }

    getMemoryAccessOut() {
        return {
            writebackValue: this.writebackValue.value,
            rd: this.rd.value,
            isAluOperation: this.isAluOperation.value,
            isLoad: this.isLoad.value,
            isLUI: this.isLUI.value,
        }
    }

}