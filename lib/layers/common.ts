import { get2DTranslate } from "../util";
import Layer from "./layer";
import TraceManager from "../traceManager";
import { BUILTIN_CLASS } from "../constant";
import { CommonLayerOption, BarrageItem } from "../types";

const DEFAULT_OPTION = {
    reuse: false,
    duration: 10000,
    checkPeriod: 1000,
    useMeasure: false,
    slideRatio: 3
};

enum animationPlayState {
    paused = "paused",
    running = "running"
}

class CommonLayer extends Layer {
    private frames: HTMLDivElement[];
    private currentFrame: HTMLDivElement;
    private sampleBarrageItem: HTMLDivElement;
    private HEIGHT: number;
    private WIDTH: number;
    private initialWidth: number;
    private animatingTime: number;
    private rect: DOMRect;
    public option: CommonLayerOption;
    private clearTicket: number;
    private pausedTime: number;
    private traceManager: TraceManager;
    private index = 0;

    private queue: BarrageItem[] = [];

    constructor(container: HTMLElement) {
        super(container);
        this.frames = [];
        this.rect = container.getBoundingClientRect();
        this.HEIGHT = container.clientHeight;
        this.WIDTH = container.clientWidth;
        this.initialWidth = this.WIDTH;
        this.type = "common";
    }

    init(option: CommonLayerOption = DEFAULT_OPTION) {
        if (option.id == null) {
            option.id = Math.random();
        }

        this.sampleBarrageItem = document.createElement("div");
        this.sampleBarrageItem.className = option.className || BUILTIN_CLASS.DEFAULT_BARRAGE;

        const { HEIGHT, WIDTH } = this;
        this.option = Object.assign({}, DEFAULT_OPTION, option);
        // this.createNewFrame();
        this.registerAnimationEvents();
        this.getBaseMeasure(BUILTIN_CLASS.DEFAULT_BARRAGE);
        const traceHeight = this.baseMeasure.outerHeight + this.baseMeasure.height;
        this.traceManager = new TraceManager({
            height: HEIGHT,
            width: WIDTH,
            traceHeight
        });
    }

    resize() {
        const { container, option } = this;
        window.getComputedStyle(container).height;
        this.rect = container.getBoundingClientRect();
        this.HEIGHT = container.clientHeight;
        this.WIDTH = container.clientWidth;
        this.getBaseMeasure(BUILTIN_CLASS.DEFAULT_BARRAGE);
        const traceHeight = this.baseMeasure.outerHeight + this.baseMeasure.height;
        this.traceManager.resize({
            height: this.HEIGHT,
            width: this.WIDTH,
            traceHeight
        });

        const newDuration = (this.WIDTH / this.initialWidth) * option.duration;

        console.log("newDuration", newDuration);
        this.currentFrame.style.animationDuration = newDuration + "ms";
        // TODO:: 计算
        this.animatingTime = Date.now();

        this.option.duration = option.duration;
    }

    start() {
        if (this.currentFrame && this.currentFrame.classList.contains(BUILTIN_CLASS.STAGE1_CLASS)) {
            console.log("already started...");
            return;
        }
        this.createNewFrame();
        this.currentFrame.classList.add(BUILTIN_CLASS.STAGE1_CLASS);
        this.animatingTime = Date.now();
        this.status = 1;
        this.traceManager.reset();
        this.recycle();
    }

    stop() {
        this.status = 0;
        this.clearTicket && clearInterval(this.clearTicket);
        this.clearFrames(0);
    }

    pause() {
        if (!this.currentFrame) {
            return;
        }
        this.frames.forEach(f => (f.style.animationPlayState = animationPlayState.paused));
        this.pausedTime = Date.now();
        this.status = 2;
    }

    continue() {
        if (!this.currentFrame) {
            return;
        }
        this.frames.forEach(f => (f.style.animationPlayState = animationPlayState.running));
        this.animatingTime += Date.now() - this.pausedTime;
        this.pausedTime = 0;
        this.status = 1;
    }

    getCurrentX(el: HTMLElement) {
        const { x } = get2DTranslate(el);
        return -x;
    }

    getElementLength(item: BarrageItem, el: HTMLElement) {
        const { useMeasure } = this.option;
        const { forceDetect, render, content } = item;
        if (!!useMeasure || forceDetect || render) {
            return Math.ceil(el.getBoundingClientRect().width);
        }
        const { baseMeasure } = this;
        return content.length * baseMeasure.letterWidth + baseMeasure.outerWidth;
    }

    getTraceInfo(item: BarrageItem) {
        if (item.trace) {
            const index = Math.min(item.trace, this.traceManager.traceCount - 1);
            return {
                index,
                y: this.traceManager.traces[index].y
            };
        }
        return this.traceManager.get();
    }

    setTraceInfo(traceIndex: number, x: number, len) {
        this.traceManager.set(traceIndex, x, len);
    }

    send(items: BarrageItem[]) {

        this.queue.push(...items);
        const { queue } = this;

        if (this.status !== 1 || queue.length <= 0) {
            return;
        }
        const frame = this.currentFrame;
        if (!frame) {
            return;
        }
        const poolItems = frame.querySelectorAll(`${BUILTIN_CLASS.DEFAULT_BARRAGE}.hide`);
        const poolLength = poolItems.length;
        const x = this.getCurrentX(frame);

        const trace = this.traceManager.getExpectedTrace(x);
        if (!trace) return;

        // 先利用资源池
        if (poolLength > 0) {
            const realLength = Math.min(queue.length, poolLength);
            let newItem = null;
            for (let index = 0; index < realLength; index++) {
                const traceInfo = this.traceManager.getExpectedTrace(x);
                if (!traceInfo) break;
                const item = queue[index];
                const { index: traceIndex, trace } = traceInfo;
                newItem = poolItems[index] as HTMLDivElement;
                newItem.class = BUILTIN_CLASS.DEFAULT_BARRAGE;
                newItem.innerHTML = item.content;
                newItem.style.cssText = `top:${trace.y}px;left:${x}px;${item.style || ""}`;
                if (item.className) {
                    newItem.classList.add(item.className);
                }
                this.setTraceInfo(traceIndex, x, this.getElementLength(item, newItem));
                queue.splice(0, 1);
            }

        }

        // 然后创建新节点
        if (queue.length > 0) {
            // const fragment = document.createDocumentFragment();

            for (let i = 0; i < queue.length; i++) {
                const traceInfo = this.traceManager.getExpectedTrace(x);
                if (!traceInfo) break;
                const { index: traceIndex, trace } = traceInfo;
                const item = queue[i];
                const newItem = this.createBarrageNode(item, x, trace.y);
                frame.appendChild(newItem);
                this.setTraceInfo(traceIndex, x, this.getElementLength(item, newItem));
                queue.splice(0, 1);
            }

            // const newItems = queue.map(item => {

            //     return frame;
            //     // return newItem;
            // });
            // // .forEach(item => fragment.appendChild(item));
            // // el.appendChild(fragment);
            // queue.splice(0);
        }
    }

    createNewFrame(durationRate = 1) {
        this.index++;
        const { duration, id, zIndex } = this.option;
        const frame: HTMLDivElement = document.createElement("div");
        frame.className = BUILTIN_CLASS.FRAME;
        frame.style.animationDuration = duration * durationRate + "ms";
        frame.id = id + "_frames_frame_" + (this.index % 4);
        frame.style.zIndex = zIndex + "";

        this.container.appendChild(frame);
        this.frames.push(frame);
        this.currentFrame = frame;
    }

    createBarrageNode(item: BarrageItem, left: number, top?: number) {
        let el = item.render && this.createBarrageNodeWithRender(item, left, top);
        if (el) {
            return el;
        }

        const { top: t, left: l } = this.getNewTopLeft(left, top);
        el = this.sampleBarrageItem.cloneNode() as HTMLElement;
        el.innerHTML = item.content;
        el.dataset.tLength = item.content.length + "";
        el.style.cssText = `top:${t}px;left:${l}px;${item.style || ""}`;
        if (item.className) {
            el.classList.add(item.className);
        }
        return el;
    }

    createBarrageNodeWithRender(item: BarrageItem, left: number, top?: number) {
        const data = { left, top, class: item.className, style: item.style };
        if (typeof item.render === "function") {
            const el = item.render(data);
            if (el instanceof HTMLElement) {
                if (!el.classList.contains(BUILTIN_CLASS.DEFAULT_BARRAGE)) {
                    el.classList.add(BUILTIN_CLASS.DEFAULT_BARRAGE);
                }
                return el;
            }
            if (typeof el === "string") {
                return this.wrapperHTMLStringBarrageNode(left, top, el);
            }
        } else if (typeof item.render === "object" && item.render instanceof HTMLElement) {
            return item.render;
        } else if (typeof item.render === "string") {
            return this.wrapperHTMLStringBarrageNode(left, top, item.render);
        }
        return null;
    }

    wrapperHTMLStringBarrageNode(left: number, top: number, content: string) {
        const { top: t, left: l } = this.getNewTopLeft(left, top);
        const el = this.sampleBarrageItem.cloneNode() as HTMLElement;
        el.innerHTML = content;
        el.style.cssText = `top:${t}px;left:${l}px;`;
        return el;
    }

    recycle() {
        const { checkPeriod } = this.option;
        window.clearInterval(this.clearTicket);
        this.clearTicket = window.setInterval(() => {
            this.frames
                .filter(frame => frame.classList.contains(BUILTIN_CLASS.STAGE2_CLASS))
                .forEach(frame => {
                    const { left, width } = this.rect;
                    const right = left + width;
                    const allItems = frame.querySelectorAll(`.${BUILTIN_CLASS.DEFAULT_BARRAGE}:not(.hide)`);
                    const notInViewItems = Array.from(allItems)
                        .slice(0, 50)
                        .filter(function (item) {
                            const rect = item.getBoundingClientRect();
                            const b = rect.left + rect.width >= left && rect.left <= right;
                            return !b;
                        });
                    console.log("notInViewItems", notInViewItems.length);
                    notInViewItems.forEach((child: HTMLElement) => {
                        child.style.cssText = "";
                        child.classList.add("hide");
                    });
                });
        }, checkPeriod);
    }

    getNewTopLeft(left: number, top?: number) {
        return {
            top: top !== undefined ? top : ~~(Math.random() * this.HEIGHT),
            left
        };
    }

    clear(el: HTMLDivElement) {
        if (this.option.reuse) {
            el.querySelectorAll(`.${BUILTIN_CLASS.DEFAULT_BARRAGE}:not(.hide)`).forEach((child: HTMLElement) => {
                child.classList.add("hide");
                if (child.style.transition) {
                    child.style.transition = null;
                    child.style.transform = null;
                }
            });
            return;
        }
        el.innerHTML = "";
    }

    resetFramesZIndex() {
        const { zIndex } = this.option;
        this.frames.forEach((f, index) => {
            f.style.zIndex = Math.max(zIndex + 2 - index, 0) + "";
        });
    }

    clearFrames(keep = 3) {
        const sliceCount = this.frames.length - keep;
        const deletingFrames = this.frames.splice(0, sliceCount);
        if (deletingFrames.length > 0) {
            for (let i = deletingFrames.length - 1; i >= 0; i--) {
                this.container.removeChild(deletingFrames[i]);
            }
        }
        if (this.frames.length === 0) {
            this.currentFrame = null;
        }
    }

    registerAnimationEvents() {
        const { frames, option } = this;
        this.container.addEventListener("animationend", (ev: AnimationEvent) => {
            const current = ev.target as HTMLDivElement;
            const { currentFrame } = this;
            if (this.frames.includes(current)) {
                // TODO:: currentFrame otherFrame
                if (current === currentFrame) {
                    // 切换animation
                    switch (ev.animationName) {
                        case BUILTIN_CLASS.STAGE1_KF_NAME:
                            this.animatingTime = Date.now();
                            currentFrame.classList.remove(BUILTIN_CLASS.STAGE1_CLASS);
                            currentFrame.classList.add(BUILTIN_CLASS.STAGE2_CLASS);
                            currentFrame.style.animationDuration = option.duration * 2 + "ms";
                            this.createNewFrame();
                            this.currentFrame.classList.add("barrage-animation-1");
                            this.resetFramesZIndex();
                            this.traceManager.increasePeriod();
                            this.traceManager.batchDecreaseX(currentFrame.getBoundingClientRect().width)
                            break;
                        case BUILTIN_CLASS.STAGE2_KF_NAME:
                            this.clear(current);
                            currentFrame.classList.remove(BUILTIN_CLASS.STAGE2_CLASS);
                            break;
                        default:
                            break;
                    }
                } else {
                    // 清理
                    this.clearFrames();
                }
            }
        });
    }
}

export default CommonLayer;
