import { Register32 } from "../register32";
import { MemoryMap, SystemInterface } from "../system-interface";
import { twos, untwos } from "../utils";
import { Decode } from "./decode";
import { PipelineStage } from "./pipeline-stage";

export interface ExecuteParams {
    shouldStall: () => boolean;
    getDecodedValuesIn: () => ReturnType<Decode['getDecodedValuesOut']>;
}

export enum ALUOperation {
    ADD  = 0b000,
    SLL  = 0b001,
    SLT  = 0b010,
    SLTU = 0b011,
    XOR  = 0b100,
    SR   = 0b101,
    OR   = 0b110,
    AND  = 0b111,
}

export class Execute extends PipelineStage {
    private shouldStall: () => boolean;
    private getDecodedValuesIn: ExecuteParams['getDecodedValuesIn'];

    private aluResult = new Register32(0);
    private aluResultNext = new Register32(0);

    private rd = 0;
    private rdNext = 0;

    private isAluOperation = false;
    private isAluOperationNext = false;

    constructor(params: ExecuteParams) {
        super();
        this.getDecodedValuesIn = params.getDecodedValuesIn;
        this.shouldStall = params.shouldStall;
    }

    compute(): void {
        if (!this.shouldStall()) {
            const decoded = this.getDecodedValuesIn();
            this.rdNext = decoded.rd;

            const isRegisterOp = Boolean((decoded.opcode >> 5) & 0x1);
            const isAlternate = Boolean((decoded.imm11_0 >> 10) & 0x1);

            const imm32 = twos((decoded.imm11_0 << 20) >> 20);

            this.isAluOperationNext = (decoded.opcode & 0b1011111) === 0b0010011;

            switch (decoded.funct3) {
                case ALUOperation.ADD: {
                    if (isRegisterOp) {
                        this.aluResultNext.value = isAlternate ? decoded.rs1 - decoded.rs2 : decoded.rs1 + decoded.rs2;
                    } else {
                        this.aluResultNext.value = decoded.rs1 + imm32;
                    }
                    break;
                };
                case ALUOperation.SLL: {
                    this.aluResultNext.value = isRegisterOp 
                        ? twos(decoded.rs1 << decoded.rs2) 
                        : twos(decoded.rs1 << decoded.shamt);
                    break;
                };
                case ALUOperation.SLT: {
                    this.aluResultNext.value = isRegisterOp 
                        ? Number(untwos(decoded.rs1) < untwos(decoded.rs2))
                        : Number(untwos(decoded.rs1) < untwos(imm32));
                    break;
                };
                case ALUOperation.SLTU: {
                    this.aluResultNext.value = isRegisterOp 
                        ? Number(decoded.rs1 < decoded.rs2)
                        : Number(decoded.rs1 < imm32);
                    break;
                };
                case ALUOperation.XOR: {
                    this.aluResultNext.value = isRegisterOp 
                        ? twos(decoded.rs1 ^ decoded.rs2)
                        : twos(decoded.rs1 ^ imm32);
                    break;
                };
                case ALUOperation.SR: {
                    this.aluResultNext.value = isRegisterOp 
                    ? isAlternate
                        ? twos(decoded.rs1 >> decoded.rs2)
                        : decoded.rs1 >>> decoded.rs2
                    : decoded.rs1 >>> decoded.shamt;
                    break;
                };
                case ALUOperation.OR: {
                    this.aluResultNext.value = isRegisterOp 
                        ? twos(decoded.rs1 | decoded.rs2)
                        : twos(decoded.rs1 | imm32);
                    break;
                };
                case ALUOperation.AND: {
                    this.aluResultNext.value = isRegisterOp 
                        ? twos(decoded.rs1 & decoded.rs2)
                        : twos(decoded.rs1 & imm32);
                    break;
                };
            }
        }
    }

    latchNext(): void {
        this.aluResult = this.aluResultNext;
        this.rd = this.rdNext;
        this.isAluOperation = this.isAluOperationNext;
    }

    getExecutionValuesOut() { 
        return {
            aluResult: this.aluResult.value,
            rd: this.rd,
            isAluOperation: this.isAluOperation,
        }
    };

}