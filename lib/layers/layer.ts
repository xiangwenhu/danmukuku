import { ElementRect, BarrageItem } from "../types";
import { measureElement } from "../util";

export default abstract class Layer {
    protected container: HTMLElement;
    protected status: number;
    protected baseMeasure: ElementRect;

    public type = "common";

    constructor(container: HTMLElement) {
        this.container = container;
    }

    abstract init(option: any): void;

    abstract start(): void;

    abstract stop(): void;

    abstract pause(): void;

    abstract continue(): void;

    abstract recycle(): void;

    abstract resize(option: any): void;

    abstract send(items: BarrageItem[]): void;

    getBaseMeasure(className, tagName: string = "div") {
        this.baseMeasure = measureElement(tagName, className, this.container);
    }

    remove(itemId: string | number) {
        const el = this.container.querySelector(`[barrage-id='${itemId}']`);
        if (el) {
            el.parentNode.removeChild(el);
        }
    }

    destroy() {
        this.container = null;
    }
}
