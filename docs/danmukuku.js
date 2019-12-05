(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.danmukuku = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BUILTIN_CLASS;
(function (BUILTIN_CLASS) {
    BUILTIN_CLASS["FRAME"] = "danmu-frame danmu-frame-common";
    BUILTIN_CLASS["DEFAULT_DANMU"] = "danmu-item";
    BUILTIN_CLASS["STAGE1_CLASS"] = "danmu-animation-1";
    BUILTIN_CLASS["STAGE2_CLASS"] = "danmu-animation-2";
    BUILTIN_CLASS["STAGE1_KF_NAME"] = "animation-stage-1";
    BUILTIN_CLASS["STAGE2_KF_NAME"] = "animation-stage-2";
})(BUILTIN_CLASS = exports.BUILTIN_CLASS || (exports.BUILTIN_CLASS = {}));

},{}],2:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = __importDefault(require("./layers/common"));
var queue_1 = require("./queue");
function toDanmuItem(danmu) {
    return typeof danmu === "string" ? { content: danmu } : danmu;
}
var DanmuManager = /** @class */ (function () {
    function DanmuManager() {
        this.layers = [];
        this.batch = this.batch.bind(this);
    }
    DanmuManager.prototype.batch = function (data) {
        var _this = this;
        // 改进批量
        data.forEach(function (d) {
            var layer = _this.layers.find(function (l) { return d.duration === l.option.duration; }) ||
                _this.layers[0];
            if (layer) {
                layer.send([d]);
            }
        });
    };
    DanmuManager.prototype.sendDanmu = function (danmu) {
        if (this.status !== 1) {
            return;
        }
        var contents = null;
        if (Array.isArray(danmu)) {
            contents = danmu.map(function (d) { return toDanmuItem(d); });
        }
        else {
            contents = [toDanmuItem(danmu)];
        }
        queue_1.enqueue(contents);
    };
    DanmuManager.prototype.init = function (container, option) {
        var _this = this;
        var optionArr = option;
        if (!Array.isArray(option)) {
            optionArr = [option];
        }
        optionArr
            .map(function (opt, index) {
            if (opt.zIndex == null) {
                opt.zIndex = index * 2;
            }
            var layer = new common_1.default(container);
            layer.init(Object.assign({}, opt, { id: index }));
            return layer;
        })
            .forEach(function (layer) { return _this.layers.push(layer); });
    };
    DanmuManager.prototype.start = function () {
        if (this.status === 1) {
            return;
        }
        this.layers.forEach(function (l) { return l.start(); });
        queue_1.addListener(this.batch);
        this.status = 1;
    };
    DanmuManager.prototype.stop = function () {
        if (![1, 2].includes(this.status)) {
            return;
        }
        this.layers.forEach(function (l) { return l.stop(); });
        queue_1.dequeue();
        queue_1.removeListener(this.batch);
        this.status = 0;
    };
    DanmuManager.prototype.pause = function () {
        if (this.status !== 1) {
            return;
        }
        this.layers.forEach(function (l) { return l.pause(); });
        this.status = 2;
    };
    DanmuManager.prototype.continue = function () {
        if (this.status !== 2) {
            return;
        }
        this.layers.forEach(function (l) { return l.continue(); });
        this.status = 1;
    };
    DanmuManager.prototype.resize = function (option) {
        this.layers.forEach(function (l) { return l.resize(option); });
    };
    DanmuManager.prototype.destory = function () {
        this.layers.forEach(function (l) { return l.destroy(); });
    };
    return DanmuManager;
}());
exports.DanmuManager = DanmuManager;
function getDanmuManager() {
    return new DanmuManager();
}
exports.default = getDanmuManager;

},{"./layers/common":3,"./queue":5}],3:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../util");
var layer_1 = __importDefault(require("./layer"));
var traceManager_1 = __importDefault(require("../traceManager"));
var constant_1 = require("../constant");
var DEFAULT_OPTION = {
    reuse: false,
    duration: 10000,
    checkPeriod: 1000,
    useMeasure: false,
    slideRatio: 3
};
var animationPlayState;
(function (animationPlayState) {
    animationPlayState["paused"] = "paused";
    animationPlayState["running"] = "running";
})(animationPlayState || (animationPlayState = {}));
var CommonLayer = /** @class */ (function (_super) {
    __extends(CommonLayer, _super);
    function CommonLayer(container) {
        var _this = _super.call(this, container) || this;
        _this.frames = [];
        _this.rect = container.getBoundingClientRect();
        _this.HEIGHT = container.clientHeight;
        _this.WIDTH = container.clientWidth;
        _this.initialWidth = _this.WIDTH;
        _this.type = "common";
        return _this;
    }
    CommonLayer.prototype.init = function (option) {
        if (option === void 0) { option = DEFAULT_OPTION; }
        if (option.id == null) {
            option.id = Math.random();
        }
        this.sampleDanmuItem = document.createElement("div");
        this.sampleDanmuItem.className = option.className || constant_1.BUILTIN_CLASS.DEFAULT_DANMU;
        var _a = this, HEIGHT = _a.HEIGHT, WIDTH = _a.WIDTH;
        this.option = Object.assign({}, DEFAULT_OPTION, option);
        this.createNewFrame();
        this.resgisterAnimationEvents();
        this.getBaseMeasure(constant_1.BUILTIN_CLASS.DEFAULT_DANMU);
        var traceHeight = this.baseMeasure.outerHeight + this.baseMeasure.height;
        this.traceManager = new traceManager_1.default({
            height: HEIGHT,
            width: WIDTH,
            traceHeight: traceHeight
        });
    };
    CommonLayer.prototype.resize = function () {
        var _a = this, container = _a.container, option = _a.option;
        window.getComputedStyle(container).height;
        this.rect = container.getBoundingClientRect();
        this.HEIGHT = container.clientHeight;
        this.WIDTH = container.clientWidth;
        this.getBaseMeasure(constant_1.BUILTIN_CLASS.DEFAULT_DANMU);
        var traceHeight = this.baseMeasure.outerHeight + this.baseMeasure.height;
        this.traceManager.resize({
            height: this.HEIGHT,
            width: this.WIDTH,
            traceHeight: traceHeight
        });
        var newDuration = (this.WIDTH / this.initialWidth) * option.duration;
        console.log("newDuration", newDuration);
        this.currentFrame.style.animationDuration = newDuration + "ms";
        // TODO:: 计算
        this.animatingTime = Date.now();
        this.option.duration = option.duration;
    };
    CommonLayer.prototype.start = function () {
        if (this.currentFrame && this.currentFrame.classList.contains(constant_1.BUILTIN_CLASS.STAGE1_CLASS)) {
            console.log("already started...");
            return;
        }
        this.createNewFrame();
        this.currentFrame.classList.add(constant_1.BUILTIN_CLASS.STAGE1_CLASS);
        this.animatingTime = Date.now();
        this.status = 1;
        this.traceManager.reset();
        this.recycle();
    };
    CommonLayer.prototype.stop = function () {
        this.status = 0;
        this.clearTicket && clearInterval(this.clearTicket);
        this.clearFrames(0);
    };
    CommonLayer.prototype.pause = function () {
        if (!this.currentFrame) {
            return;
        }
        this.frames.forEach(function (f) { return (f.style.animationPlayState = animationPlayState.paused); });
        this.pausedTime = Date.now();
        this.status = 2;
    };
    CommonLayer.prototype.continue = function () {
        if (!this.currentFrame) {
            return;
        }
        this.frames.forEach(function (f) { return (f.style.animationPlayState = animationPlayState.running); });
        this.animatingTime += Date.now() - this.pausedTime;
        this.pausedTime = 0;
        this.status = 1;
    };
    CommonLayer.prototype.getCurrentX = function (el) {
        var x = util_1.get2DTranslate(el).x;
        return -x;
    };
    CommonLayer.prototype.getElementLength = function (item, el) {
        var useMeasure = this.option.useMeasure;
        var forceDetect = item.forceDetect, render = item.render, content = item.content;
        if (!useMeasure || forceDetect || render) {
            return el.getBoundingClientRect().width;
        }
        var baseMeasure = this.baseMeasure;
        return content.length * baseMeasure.letterWidth + baseMeasure.outerWidth;
    };
    CommonLayer.prototype.getTraceInfo = function (item) {
        if (item.trace) {
            var index = Math.min(item.trace, this.traceManager.traceCount - 1);
            return {
                index: index,
                y: this.traceManager.traces[index].y
            };
        }
        return this.traceManager.get();
    };
    CommonLayer.prototype.setTraceInfo = function (traceIndex, x, len) {
        this.traceManager.set(traceIndex, x, len);
    };
    CommonLayer.prototype.send = function (queue) {
        var _this = this;
        if (this.status !== 1 || queue.length <= 0) {
            return;
        }
        var el = this.currentFrame;
        if (!el) {
            return;
        }
        var poolItems = el.querySelectorAll(constant_1.BUILTIN_CLASS.DEFAULT_DANMU + ".hide");
        var poolLength = poolItems.length;
        var x = this.getCurrentX(el);
        // 先利用资源池
        if (poolLength > 0) {
            var realLength = Math.min(queue.length, poolLength);
            var newItem = null;
            for (var index = 0; index < realLength; index++) {
                var item = queue[index];
                var _a = this.getTraceInfo(item), traceIndex = _a.index, top_1 = _a.y;
                newItem = poolItems[index];
                newItem.class = constant_1.BUILTIN_CLASS.DEFAULT_DANMU;
                newItem.innerHTML = item.content;
                newItem.style.cssText = "top:" + top_1 + "px;left:" + x + "px;" + (item.style || "");
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
            var newItems = queue.map(function (item) {
                var _a = _this.getTraceInfo(item), traceIndex = _a.index, top = _a.y;
                var newItem = _this.createDanmuItem(item, x, top);
                el.appendChild(newItem);
                _this.setTraceInfo(traceIndex, x, _this.getElementLength(item, newItem));
                return el;
                // return newItem;
            });
            // .forEach(item => frament.appendChild(item));
            // el.appendChild(frament);
            queue.splice(0);
        }
    };
    CommonLayer.prototype.createNewFrame = function (durationRate) {
        if (durationRate === void 0) { durationRate = 1; }
        var _a = this.option, duration = _a.duration, id = _a.id, zIndex = _a.zIndex;
        var frame = document.createElement("div");
        frame.className = constant_1.BUILTIN_CLASS.FRAME;
        frame.style.animationDuration = duration * durationRate + "ms";
        frame.id = id + "_frames_frame_" + this.frames.length;
        frame.style.zIndex = zIndex + "";
        this.container.appendChild(frame);
        this.frames.push(frame);
        this.currentFrame = frame;
    };
    CommonLayer.prototype.createDanmuItem = function (item, left, top) {
        var el = item.render && this.createDanmuWithRender(item, left, top);
        if (el) {
            return el;
        }
        var _a = this.getNewTopLeft(left, top), t = _a.top, l = _a.left;
        el = this.sampleDanmuItem.cloneNode();
        el.innerHTML = item.content;
        el.dataset.tLength = item.content.length + "";
        el.style.cssText = "top:" + t + "px;left:" + l + "px;" + (item.style || "");
        if (item.className) {
            el.classList.add(item.className);
        }
        return el;
    };
    CommonLayer.prototype.createDanmuWithRender = function (item, left, top) {
        var data = { left: left, top: top, class: item.className, style: item.style };
        if (typeof item.render === "function") {
            var el = item.render(data);
            if (el instanceof HTMLElement) {
                if (!el.classList.contains(constant_1.BUILTIN_CLASS.DEFAULT_DANMU)) {
                    el.classList.add(constant_1.BUILTIN_CLASS.DEFAULT_DANMU);
                }
                return el;
            }
            if (typeof el === "string") {
                return this.wrapperHTMLStringDanmu(left, top, el);
            }
        }
        else if (typeof item.render === "object" && item.render instanceof HTMLElement) {
            return item.render;
        }
        else if (typeof item.render === "string") {
            return this.wrapperHTMLStringDanmu(left, top, item.render);
        }
        return null;
    };
    CommonLayer.prototype.wrapperHTMLStringDanmu = function (left, top, content) {
        var _a = this.getNewTopLeft(left, top), t = _a.top, l = _a.left;
        var el = this.sampleDanmuItem.cloneNode();
        el.innerHTML = content;
        el.style.cssText = "top:" + t + "px;left:" + l + "px;";
        return el;
    };
    CommonLayer.prototype.recycle = function () {
        var _this = this;
        var checkPeriod = this.option.checkPeriod;
        window.clearInterval(this.clearTicket);
        this.clearTicket = window.setInterval(function () {
            _this.frames
                .filter(function (frame) { return frame.classList.contains(constant_1.BUILTIN_CLASS.STAGE2_CLASS); })
                .forEach(function (frame) {
                var _a = _this.rect, left = _a.left, width = _a.width;
                var right = left + width;
                var allItems = frame.querySelectorAll("." + constant_1.BUILTIN_CLASS.DEFAULT_DANMU + ":not(.hide)");
                var notInViewItems = Array.from(allItems)
                    .slice(0, 50)
                    .filter(function (item) {
                    var rect = item.getBoundingClientRect();
                    var b = rect.left + rect.width >= left && rect.left <= right;
                    return !b;
                });
                console.log("notInViewItems", notInViewItems.length);
                notInViewItems.forEach(function (child) {
                    child.style.cssText = "";
                    child.classList.add("hide");
                });
            });
        }, checkPeriod);
    };
    CommonLayer.prototype.getNewTopLeft = function (left, top) {
        return {
            top: top !== undefined ? top : ~~(Math.random() * this.HEIGHT),
            left: left
        };
    };
    CommonLayer.prototype.clearDanmus = function (el) {
        if (this.option.reuse) {
            el.querySelectorAll("." + constant_1.BUILTIN_CLASS.DEFAULT_DANMU + ":not(.hide)").forEach(function (child) {
                child.classList.add("hide");
                if (child.style.transition) {
                    child.style.transition = null;
                    child.style.transform = null;
                }
            });
            return;
        }
        el.innerHTML = "";
    };
    CommonLayer.prototype.resetFramesZindex = function () {
        var zIndex = this.option.zIndex;
        this.frames.forEach(function (f, index) {
            f.style.zIndex = Math.max(zIndex + 2 - index, 0) + "";
        });
    };
    CommonLayer.prototype.clearFrames = function (keep) {
        if (keep === void 0) { keep = 3; }
        var sliceCount = this.frames.length - keep;
        var deletingFrames = this.frames.splice(0, sliceCount);
        if (deletingFrames.length > 0) {
            for (var i = deletingFrames.length - 1; i >= 0; i--) {
                this.container.removeChild(deletingFrames[i]);
            }
        }
        if (this.frames.length === 0) {
            this.currentFrame = null;
        }
    };
    CommonLayer.prototype.resgisterAnimationEvents = function () {
        var _this = this;
        var _a = this, frames = _a.frames, option = _a.option;
        this.container.addEventListener("animationend", function (ev) {
            var current = ev.target;
            var currentFrame = _this.currentFrame;
            if (_this.frames.includes(current)) {
                // TODO:: currentFrame otherFrame
                if (current === currentFrame) {
                    // 切换animation
                    switch (ev.animationName) {
                        case constant_1.BUILTIN_CLASS.STAGE1_KF_NAME:
                            _this.animatingTime = Date.now();
                            currentFrame.classList.remove(constant_1.BUILTIN_CLASS.STAGE1_CLASS);
                            currentFrame.classList.add(constant_1.BUILTIN_CLASS.STAGE2_CLASS);
                            currentFrame.style.animationDuration = option.duration * 2 + "ms";
                            _this.createNewFrame();
                            _this.currentFrame.classList.add("danmu-animation-1");
                            _this.resetFramesZindex();
                            _this.traceManager.increasePeriod();
                            break;
                        case constant_1.BUILTIN_CLASS.STAGE2_KF_NAME:
                            _this.clearDanmus(currentFrame);
                            currentFrame.classList.remove(constant_1.BUILTIN_CLASS.STAGE2_CLASS);
                            break;
                        default:
                            break;
                    }
                }
                else {
                    // 清理
                    _this.clearFrames();
                }
            }
        });
    };
    return CommonLayer;
}(layer_1.default));
exports.default = CommonLayer;

},{"../constant":1,"../traceManager":6,"../util":7,"./layer":4}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../util");
var Layer = /** @class */ (function () {
    function Layer(container) {
        this.type = "common";
        this.container = container;
    }
    Layer.prototype.getBaseMeasure = function (className, tagName) {
        if (tagName === void 0) { tagName = "div"; }
        this.baseMeasure = util_1.measureElement(tagName, className, this.container);
    };
    Layer.prototype.remove = function (itemId) {
        var el = this.container.querySelector("[danmu-id='" + itemId + "']");
        if (el) {
            el.parentNode.removeChild(el);
        }
    };
    Layer.prototype.destroy = function () {
        this.container = null;
    };
    return Layer;
}());
exports.default = Layer;

},{"../util":7}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var queue = [];
var callBacks = [];
var requestId = null;
function dequeue() {
    return queue.splice(0);
}
exports.dequeue = dequeue;
function enqueue(data) {
    queue.push.apply(queue, data);
}
exports.enqueue = enqueue;
function clear() {
    if (requestId) {
        cancelAnimationFrame(requestId);
        requestId = null;
    }
}
function startListen() {
    var data = dequeue();
    callBacks.forEach(function (cb) { return cb(data); });
    requestId = requestAnimationFrame(function () { return startListen(); });
}
function addListener(cb) {
    callBacks.push(cb);
    if (!requestId) {
        startListen();
    }
}
exports.addListener = addListener;
function removeListener(cb) {
    var index = callBacks.findIndex(function (c) { return c === cb; });
    if (index >= 0) {
        callBacks.splice(index, 1);
    }
    if (callBacks.length <= 0) {
        clear();
    }
}
exports.removeListener = removeListener;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TraceStrategy;
(function (TraceStrategy) {
    TraceStrategy["radom"] = "random";
    TraceStrategy["quque"] = "queque";
})(TraceStrategy = exports.TraceStrategy || (exports.TraceStrategy = {}));
var TraceManager = /** @class */ (function () {
    function TraceManager(option) {
        this.option = option;
        this.period = 0;
        this.traces = [];
        this.createTraces();
        this.xaxis = 0;
        this.lastIndex = 0;
    }
    TraceManager.prototype.increasePeriod = function () {
        this.period++;
        this.xaxis += this.option.width;
    };
    Object.defineProperty(TraceManager.prototype, "traceCount", {
        get: function () {
            return this.traces.length;
        },
        enumerable: true,
        configurable: true
    });
    TraceManager.prototype.createTraces = function () {
        var traces = [];
        var _a = this.option, height = _a.height, traceHeight = _a.traceHeight;
        var count = ~~(height / traceHeight);
        for (var i = 0; i < count; i++) {
            traces.push({
                tail: 0,
                y: traceHeight * i
            });
        }
        this.traces = traces;
    };
    TraceManager.prototype.reset = function () {
        this.period = 0;
        this.traces = [];
        this.createTraces();
        this.xaxis = 0;
    };
    TraceManager.prototype.resize = function (option) {
        this.option = option;
        var traces = this.traces;
        var oldTraceCount = traces.length;
        var _a = this.option, height = _a.height, traceHeight = _a.traceHeight;
        var count = ~~(height / traceHeight);
        if (count === oldTraceCount) {
            return;
        }
        if (count < oldTraceCount) {
            traces.splice(count);
            return;
        }
        var index = this.findTraceIndex();
        var baseValue = index >= 0 ? traces[index].tail : 0;
        for (var i = oldTraceCount - 1; i < count; i++) {
            traces.push({
                tail: baseValue,
                y: traceHeight * i
            });
        }
    };
    TraceManager.prototype.get = function () {
        var index = this.findTraceIndex();
        var trace = this.traces[index];
        // 两次相等，随机
        if (index === this.lastIndex) {
            index = ~~(Math.random() * this.traceCount);
            trace = this.traces[index];
        }
        this.lastIndex = index;
        return {
            index: index,
            y: trace.y
        };
    };
    TraceManager.prototype.set = function (index, x, len) {
        var trace = this.traces[index];
        trace.tail = this.xaxis + Math.max(x + len, trace.tail);
    };
    TraceManager.prototype.findTraceIndex = function () {
        var tv = this.traces.map(function (t) { return t.tail; });
        var min = Math.min.apply(Math, tv);
        var index = this.traces.findIndex(function (t) { return t.tail === min; });
        return index;
    };
    return TraceManager;
}());
exports.default = TraceManager;

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var getComputedStyle = window.getComputedStyle;
function pxToNumer(v) {
    return +v.replace("px", "");
}
exports.pxToNumer = pxToNumer;
function pxToRem(pxValue, digits) {
    if (digits === void 0) { digits = 2; }
    var fontSize = pxToNumer(getComputedStyle(document.documentElement).fontSize);
    return +(pxValue / fontSize).toFixed(digits);
}
exports.pxToRem = pxToRem;
function getRemValue() {
    return pxToNumer(getComputedStyle(document.documentElement).fontSize);
}
exports.getRemValue = getRemValue;
function get2DTranslate(el) {
    var ts = getComputedStyle(el).transform;
    if (ts === "none") {
        return {
            x: 0,
            y: 0
        };
    }
    var tsl = ts.match(/matrix\((.*)\)/)[1].split(",");
    return {
        x: +tsl[4].trim(),
        y: +tsl[5].trim()
    };
}
exports.get2DTranslate = get2DTranslate;
function getTranslateX(el) {
    var x = get2DTranslate(el).x;
    return -x;
}
exports.getTranslateX = getTranslateX;
function measureElement(tag, className, parent) {
    if (parent === void 0) { parent = document.body; }
    var el = document.createElement(tag);
    el.className = className;
    // 考虑letter Space
    el.innerHTML = "啊啊";
    el.style.cssText = "position:absolute; visibility:hidden;display:inline-block;width:auto";
    parent.appendChild(el);
    var cstyle = getComputedStyle(el);
    var borderWidth = pxToNumer(cstyle.borderLeftWidth) + pxToNumer(cstyle.borderRightWidth);
    var paddingWidth = pxToNumer(cstyle.paddingLeft) + pxToNumer(cstyle.paddingRight);
    var marginWidth = pxToNumer(cstyle.marginLeft) + pxToNumer(cstyle.marginRight);
    var borderHeight = pxToNumer(cstyle.borderTopWidth) + pxToNumer(cstyle.borderBottomWidth);
    var paddingHeight = pxToNumer(cstyle.paddingTop) + pxToNumer(cstyle.paddingBottom);
    var marginHeight = pxToNumer(cstyle.marginTop) + pxToNumer(cstyle.marginBottom);
    var width = pxToNumer(cstyle.width);
    var height = pxToNumer(cstyle.height);
    var outerWidth = borderWidth + paddingWidth + marginWidth;
    var outerHeight = borderHeight + paddingHeight + marginHeight;
    console.log(outerWidth, width);
    parent.removeChild(el);
    return {
        outerWidth: outerWidth,
        outerHeight: outerHeight,
        letterWidth: width / 2,
        height: height
    };
}
exports.measureElement = measureElement;

},{}]},{},[2])(2)
});
