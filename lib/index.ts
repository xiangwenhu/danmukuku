import { BarrageItem, CommonLayerOption } from './types';
import Layer from "./layers/layer";
import CommonLayer from "./layers/common";
import { enqueue, addListener, removeListener, dequeue } from "./queue";


type BarrageContent = string | BarrageItem;

function toBarrageItem(item: string | BarrageItem): BarrageItem {
    return typeof item === "string" ? { content: item } : item;
}

export default class BarrageManager {
    private layers: Layer[] = [];
    private status: 0 | 1 | 2; // 枚举？ 0: 停止  1 运行  2 暂停

    constructor() {
        this.batch = this.batch.bind(this);
    }

    private batch(data: BarrageItem[]) {
        // 改进批量
        data.forEach(d => {
            const layer =
                this.layers.find(l => d.duration === (l as CommonLayer).option.duration) ||
                this.layers[0];

            if (layer) {
                layer.send([d]);
            }
        });
    }

    send(content: BarrageContent[] | BarrageItem | string) {
        if (this.status !== 1) {
            return;
        }
        let contents: BarrageItem[] = null;
        if (Array.isArray(content)) {
            contents = content.map((d: BarrageItem | string) => toBarrageItem(d));
        } else {
            contents = [toBarrageItem(content)];
        }

        enqueue(contents);
    }

    init(container: HTMLElement, option?: CommonLayerOption[]) {
        let optionArr = option;
        if (!Array.isArray(option)) {
            optionArr = [option];
        }

        optionArr
            .map((opt, index) => {
                if (opt.zIndex == null) {
                    opt.zIndex = index * 2;
                }
                const layer = new CommonLayer(container);
                layer.init(Object.assign({}, opt, { id: index }));
                return layer;
            })
            .forEach((layer: Layer) => this.layers.push(layer));
    }

    start() {
        if (this.status === 1) {
            return;
        }
        this.layers.forEach(l => l.start());
        addListener(this.batch);
        this.status = 1;
    }

    stop() {
        if (![1, 2].includes(this.status)) {
            return;
        }
        this.layers.forEach(l => l.stop());
        dequeue();
        removeListener(this.batch);
        this.status = 0;
    }

    pause() {
        if (this.status !== 1) {
            return;
        }
        this.layers.forEach(l => l.pause());
        this.status = 2;
    }

    continue() {
        if (this.status !== 2) {
            return;
        }
        this.layers.forEach(l => l.continue());
        this.status = 1;
    }

    resize(option: CommonLayerOption) {
        this.layers.forEach(l => l.resize(option));
    }

    destroy() {
        this.layers.forEach(l => l.destroy());
    }
}

