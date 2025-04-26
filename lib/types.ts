export interface ElementRect {
    outerWidth: number;
    outerHeight: number;
    letterWidth: number;
    height: number;
}

export interface CommonLayerOption {
    reuse?: boolean;
    duration?: number;
    checkPeriod?: number;
    useMeasure?: boolean;
    id?: number | string;
    zIndex?: number;
    className?: string;
}

export interface BarrageItem {
    content?: string;
    forceDetect?: boolean;
    render?: ((any) => HTMLElement) | HTMLElement | string;
    className?: string;
    style?: string;
    trace?: number;
    duration?: number;
}

