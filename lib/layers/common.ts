import { get2DTranslate } from "../util";
import Layer from "./layer";
import TraceManager from "../traceManager";
import { DanmuItem } from "../index";

export interface CommonLayerOption {
    reuse?: boolean;
    duration?: number;
    checkPeriod?: number;
    useMeasure?: boolean;
    id?: number | string;
    zIndex?: number;
}

const DEFAULT_OPTION = {
    reuse: false,
    duration: 10000,
    checkPeriod: 1000,
    useMeasure: false,
    slideRatio: 3
};

const DEFAULT_DANMU_CLASS = "danmu-item";
const ANIMATION_STAGE1_CLASS = "danmu-animation-1";
const ANIMATION_STAGE2_CLASS = "danmu-animation-2";
const ANIMATION_STAGE1_NAME = "animation-stage-1";
const ANIMATION_STAGE2_NAME = "animation-stage-2";

enum animationPlayState {
    paused = "paused",
    running = "running"
}

class CommonLayer extends Layer {
    private frames: HTMLDivElement[];
    private currentFrame: HTMLDivElement;
    private sample: HTMLDivElement;
    private HEIGHT: number;
    private WIDTH: number;
    private initialWidth: number;
    private animatingTime: number;
    private rect: ClientRect;
    public option: CommonLayerOption;
    private clearTicket: number;
    private pausedTime: number;
    private traceManager: TraceManager;

    constructor(container: HTMLElement) {
        super(container);
        this.frames = [];
        this.sample = document.createElement("div");
        this.sample.className = DEFAULT_DANMU_CLASS;
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

        const { HEIGHT, WIDTH } = this;
        this.option = Object.assign({}, DEFAULT_OPTION, option);
        this.createNewFrame();
        this.resgisterAnimationEvents();
        this.getBaseMeasure(DEFAULT_DANMU_CLASS);
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
        this.getBaseMeasure(DEFAULT_DANMU_CLASS);
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
        if (this.currentFrame && this.currentFrame.classList.contains(ANIMATION_STAGE1_CLASS)) {
            console.log("already started...");
            return;
        }
        this.createNewFrame();
        this.currentFrame.classList.add(ANIMATION_STAGE1_CLASS);
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

    getElementLength(item: DanmuItem, el: HTMLElement) {
        const { useMeasure } = this.option;
        const { forceDetect, render, content } = item;
        if (!useMeasure || forceDetect || render) {
            return el.getBoundingClientRect().width;
        }
        if (useMeasure) {
            const { baseMeasure } = this;
            return content.length * baseMeasure.letterWidth + baseMeasure.outerWidth;
        }
    }

    getTraceInfo(item: DanmuItem) {
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

    send(queue: DanmuItem[]) {
        if (this.status !== 1 || queue.length <= 0) {
            return;
        }

        const el = this.currentFrame;
        if (!el) {
            return;
        }
        const poolItems = el.querySelectorAll(".danmu-item.hide");
        const poolLength = poolItems.length;
        const x = this.getCurrentX(el);
        // 先利用资源池
        if (poolLength > 0) {
            const realLength = Math.min(queue.length, poolLength);
            let newItem = null;
            for (let index = 0; index < realLength; index++) {
                const item = queue[index];
                const { index: traceIndex, y: top } = this.getTraceInfo(item);
                newItem = poolItems[index] as HTMLDivElement;
                newItem.class = DEFAULT_DANMU_CLASS;
                newItem.innerHTML = item.content;
                newItem.style.cssText = `top:${top}px;left:${x}px;${item.style || ""}`;
                if (item.className) {
                    newItem.classList.add(item.className);
                }
                this.setTraceInfo(traceIndex, x, this.getElementLength(item, newItem));
            }
            queue.splice(0, realLength);
        }

        // 然后创建新节点
        if (queue.length > 0) {
            // const frament = document.createDocumentFragment();
            const newItems = queue.map(item => {
                const { index: traceIndex, y: top } = this.getTraceInfo(item);
                const newItem = this.createDanmuItem(item, x, top);
                el.appendChild(newItem);
                this.setTraceInfo(traceIndex, x, this.getElementLength(item, newItem));
                return el;
                // return newItem;
            });
            // .forEach(item => frament.appendChild(item));
            // el.appendChild(frament);
            queue.splice(0);
        }
    }

    createNewFrame(durationRate = 1) {
        const { duration, id, zIndex } = this.option;
        const frame: HTMLDivElement = document.createElement("div");
        frame.className = "danmu-frame danmu-frame-common";
        frame.style.animationDuration = duration * durationRate + "ms";
        frame.id = id + "_frames_frame_" + this.frames.length;
        frame.style.zIndex = zIndex + "";

        this.container.appendChild(frame);
        this.frames.push(frame);
        this.currentFrame = frame;
    }

    createDanmuItem(item: DanmuItem, left: number, top?: number) {
        let el = item.render && this.createDanmuWithRender(item, left, top);
        if (el) {
            return el;
        }

        const { top: t, left: l } = this.getNewTopLeft(left, top);
        el = this.sample.cloneNode() as HTMLElement;
        el.innerHTML = item.content;
        el.dataset.tLength = item.content.length + "";
        el.style.cssText = `top:${t}px;left:${l}px;${item.style || ""}`;
        if (item.className) {
            el.classList.add(item.className);
        }
        return el;
    }

    createDanmuWithRender(item: DanmuItem, left: number, top?: number) {
        const data = { left, top, class: item.className, style: item.style };
        if (typeof item.render === "function") {
            const el = item.render(data);
            if (el instanceof HTMLElement) {
                if (!el.classList.contains(DEFAULT_DANMU_CLASS)) {
                    el.classList.add(DEFAULT_DANMU_CLASS);
                }
                return el;
            }
            if (typeof el === "string") {
                return this.wrapperHTMLStringDanmu(left, top, item.render);
            }
        } else if (typeof item.render === "object" && item.render instanceof HTMLElement) {
            return item.render;
        } else if (typeof item.render === "string") {
            return this.wrapperHTMLStringDanmu(left, top, item.render);
        }
        return null;
    }

    wrapperHTMLStringDanmu(left, top, content) {
        const { top: t, left: l } = this.getNewTopLeft(left, top);
        const el = this.sample.cloneNode() as HTMLElement;
        el.innerHTML = content;
        el.style.cssText = `top:${t}px;left:${l}px;`;
        return el;
    }

    recycle() {
        const { checkPeriod } = this.option;
        this.clearTicket = setInterval(() => {
            this.frames
                .filter(frame => frame.classList.contains(ANIMATION_STAGE2_CLASS))
                .forEach(frame => {
                    const { left, width } = this.rect;
                    const right = left + width;
                    const allItems = frame.querySelectorAll(".danmu-item:not(.hide)");
                    const notInViewItems = Array.from(allItems)
                        .slice(0, 50)
                        .filter(function(item) {
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

    clearDanmus(el: HTMLDivElement) {
        if (this.option.reuse) {
            el.querySelectorAll(".danmu-item:not(.hide)").forEach((child: HTMLElement) => {
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

    resetFramesZindex() {
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

    resgisterAnimationEvents() {
        const { frames, option } = this;
        this.container.addEventListener("animationend", (ev: AnimationEvent) => {
            const current = ev.target as HTMLDivElement;
            const { currentFrame } = this;
            if (this.frames.includes(current)) {
                // TODO:: currentFrame otherFrame
                if (current === currentFrame) {
                    // 切换animation
                    switch (ev.animationName) {
                        case ANIMATION_STAGE1_NAME:
                            this.animatingTime = Date.now();
                            currentFrame.classList.remove(ANIMATION_STAGE1_CLASS);
                            currentFrame.classList.add(ANIMATION_STAGE2_CLASS);
                            currentFrame.style.animationDuration = option.duration * 2 + "ms";
                            this.createNewFrame();
                            this.currentFrame.classList.add("danmu-animation-1");
                            this.resetFramesZindex();
                            this.traceManager.increasePeriod();
                            break;
                        case ANIMATION_STAGE2_NAME:
                            this.clearDanmus(currentFrame);
                            currentFrame.classList.remove(ANIMATION_STAGE2_CLASS);
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
