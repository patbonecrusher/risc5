import { Register32 } from "../register32";
import { MemoryAccess } from "./memory-access";
import { PipelineStage } from "./pipeline-stage";

export interface WriteBackParams {
    shouldStall: () => boolean;
    getMemoryValuesIn: () => ReturnType<MemoryAccess['getMemoryAccessOut']>;
    regFile: Array<Register32>;
}

export class WriteBack extends PipelineStage {

    private shouldStall: WriteBackParams['shouldStall'];
    private getMemoryValuesIn: WriteBackParams['getMemoryValuesIn'];
    private regFile: WriteBackParams['regFile'];

    constructor(params: WriteBackParams) {
        super();
        this.shouldStall = params.shouldStall;
        this.getMemoryValuesIn = params.getMemoryValuesIn;
        this.regFile = params.regFile;
    }

    compute(): void {
        if (!this.shouldStall()) {
            const {aluResult, rd, isAluOperation} = this.getMemoryValuesIn();
            if (isAluOperation) {
                this.regFile[rd].value = aluResult;
            }
        }
    }

    latchNext(): void {
    }

}