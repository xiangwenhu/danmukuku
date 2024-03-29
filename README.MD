## 基本思路
1. **Frame都和视框同大小，（width:100%）, 发射后移动两阶段  -100%，  -300%， 完毕销毁。**
2. 只有Slide Frame模式
3. 可以初始化多个Slide Frame模式的层
4. 共用TraceManager




## 特性
1. 支持1500+弹幕同时在屏幕，实际节点可能大于4000
2. FPS稳定 1200+弹幕 稳定在 50+
3. 可以自定义弹幕样式，添加图片等


## 在做
----------------------

* [x] 弹幕最长宽度
width 300%的时候，弹幕最长的长度为屏宽的50%    
width 400%的时候，弹幕最长的长度为屏宽的100%    
计算公式  `长度倍数/2 - 1` , 例如5倍， 弹幕最大长度为150%

* [x] 不使用getComputedStyle   
使用计时来控制 --已支持


* ~~[ ] 普通弹幕位置left采用百分比~~

* [x] 支持style和class
   
* [ ] 节点回收改进
  * [ ] 标记length或者添加的时候记录长度
  * [ ] 标记复用节点次数
  * [x] innerHTML=""

* [x] 弹幕最长长度可配置|可选
* [x] resize
* [x] 弹幕自身有速度
* [ ] 预创建弹幕节点   
    requestildecallback 

* [ ] destroy

## ISSUE
* [ ] 弹幕覆盖问题
* [x] 慢速轨道问题   
    需要记录每条轨道最后的tail，现在存在问题    
    需要 x + len, 这需要Factory记录走过的屏数
* [ ] 引入shedule概念




## 尝试

普通弹幕
* ~~三个frame走~~
* * [x]  getComputedStyle获取当前位移
*  ~~iframe作为容器~~
*  ~~translate代替弹幕元素的left,top~~
*  ~~transition~~

加速弹幕
* ~~StyleSheet~~: 性能低下
```js
            this.styleSheet.insertRule(`
                @keyframes animation-acc-${id} {
                    from {
                        transform: translate3d(0, 0, 0);
                    }
                    to {
                        transform: translate3d(-${this.WIDTH + len}px, 0, 0);
                    }
                }
            `, this.styleSheet.rules.length);
``` 
* CSS Scope / Style Scope
  