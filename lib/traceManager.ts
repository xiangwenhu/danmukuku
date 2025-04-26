export enum TraceStrategy {
    random = "random",
    queue = "queue"
}

export interface TraceMangerOption {
    height: number;
    width: number;
    traceHeight: number;
}

interface Trace {
    tail: number;
    y: number;
}

class TraceManager {
    private option: TraceMangerOption;
    public traces: Trace[];
    private period: number;
    private XAxis: number;
    private lastIndex: number;
    constructor(option: TraceMangerOption) {
        this.option = option;
        this.period = 0;
        this.traces = [];
        this.createTraces();
        this.XAxis = 0;
        this.lastIndex = 0;
    }

    increasePeriod() {
        this.period++;
        this.XAxis += this.option.width;
    }

    get traceCount() {
        return this.traces.length;
    }

    createTraces() {
        const traces = [];

        const { height, traceHeight } = this.option;
        const count = ~~(height / traceHeight);
        for (let i = 0; i < count; i++) {
            traces.push({
                tail: 0,
                y: traceHeight * i
            });
        }
        this.traces = traces;
    }

    reset() {
        this.period = 0;
        this.traces = [];
        this.createTraces();
        this.XAxis = 0;
    }

    resize(option: TraceMangerOption) {
        this.option = option;
        const { traces } = this;
        const oldTraceCount = traces.length;
        const { height, traceHeight } = this.option;
        const count = ~~(height / traceHeight);

        if (count === oldTraceCount) {
            return;
        }

        if (count < oldTraceCount) {
            traces.splice(count);
            return;
        }

        const index = this.findMinTraceIndex();
        const baseValue = index >= 0 ? traces[index].tail : 0;

        for (let i = oldTraceCount - 1; i < count; i++) {
            traces.push({
                tail: baseValue,
                y: traceHeight * i
            });
        }
    }

    get() {
        let index = this.findMinTraceIndex();
        let trace = this.traces[index];

        // 两次相等，随机
        // if (index === this.lastIndex) {
        //     index = ~~(Math.random() * this.traceCount);
        //     trace = this.traces[index];
        // }
        this.lastIndex = index;

        return {
            index,
            y: trace.y
        };
    }

    set(index: number, x: number, len: number) {
        const trace = this.traces[index];
        trace.tail = this.XAxis + Math.max(x + len, trace.tail);
    }

    findMinTraceIndex() {
        // sort ?
        const tv = this.traces.map(t => t.tail);
        const min = Math.min(...tv);
        const index = this.traces.findIndex(t => t.tail === min);
        return index;
    }
}

export default TraceManager;
