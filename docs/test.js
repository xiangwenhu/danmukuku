var videoEl = document.querySelector("video");
var isPlayed = false;
videoEl.oncanplay = function () {
    if (!isPlayed) {
        isPlayed = true;
    }
};
var containerEl = document.getElementById("container");
var manager = null;
manager = new window.fragmentBarrage.default();
window.manager = manager;
manager.init(containerEl, [
    {
        duration: 10000,
        useMeasure: true,
    },
    {
        duration: 8000,
        useMeasure: true,
    },
    {
        duration: 6000,
        useMeasure: true,
    },
]);
manager.start();
var ticket = 0;
var pools = [
    {
        content: "完结撒花完结撒花完结撒花",
        style: "color:Red",
        duration: 10000,
    },
    { content: "25.5啥的也算一级", style: "color:#FFFFFF", duration: 8000 },
    {
        forceDetect: true,
        duration: 6000,
        content:
            "<img src='https://img.soogif.com/VO7KJY9mZv3FByd2Igf7K9fGlRlmursf.gif' style='height:30px;vertical-align: middle;'>留下jo印留下jo印留下jo印",
    },
    { duration: 6000, render: "高价回收天堂之眼，不要问我为什么" },
    {
        render: ({ left, top }) => {
            const el = document.createElement("span");
            el.innerHTML = "麦姐在学院除了老大老二基本就是最厉害的了 from span";
            el.style.left = left + "px";
            el.style.top = top + "px";
            // el.style.zIndex = "999";
            // el.style.backgroundColor = "#666";
            return el;
        },
    },
    {
        content:
            "<img src='https://p6-passport.byteacctimg.com/img/user-avatar/f1a9f122e925aeef5e4534ff7f706729~90x90.awebp' style='height:20px'/> 头像哦",
        forceDetect: true,
        style: "z-index:99;",
    },
    "好假炮姐当年1v3有一个5的和两个4的都打得过",
    "这个女的好帅啊，一拳一个机器人的那个",
    "哇喔哇喔哇喔哇喔好燃啊！！！",
    "黑琴黑琴黑琴黑琴黑琴黑琴黑琴黑琴黑琴黑琴黑琴黑琴黑琴黑琴",
    {
        content: "子弹是金属，枪也是金属，炮姐直接操控啊,子弹是金属",
        style: "color:yellow",
        duration: 8000,
    },
];
function getRandomIndex(len) {
    return ~~(Math.random() * len);
}
function batchGet(count) {
    var r = [];
    var len = pools.length;
    for (var i = 0; i < count; i++) {
        r.push(pools[getRandomIndex(len)]);
    }
    return r;
}
var txtIntervalEl = document.getElementById("txtInterval");
var txtBatchCount = document.getElementById("txtBatchCount");
function startBatch() {
    var batchCount = +txtBatchCount.value;
    manager.send(batchGet(batchCount));
    ticket = window.setInterval(function () {
        manager.send(batchGet(batchCount));
    }, +txtIntervalEl.value);
}
var isBigTest = false;
var txtDanmuEl = document.getElementById("txtDanmu");
document.getElementById("btnSend").addEventListener(
    "click",
    function (ev) {
        manager.send(txtDanmuEl.value);
        ev.stopPropagation();
    },
    false
);
document.getElementById("btnPause").addEventListener("click", function () {
    if (isBigTest) {
        clearInterval(ticket);
    }
    manager.pause();
});
document.getElementById("btnContiue").addEventListener("click", function () {
    if (isBigTest) {
        startBatch();
    }
    manager["continue"]();
});
document.getElementById("btnStart").addEventListener("click", function () {
    manager.start();
});
document.getElementById("btnStop").addEventListener("click", function () {
    manager.stop();
    clearInterval(ticket);
    isBigTest = false;
});
document.getElementById("btnBigTest").addEventListener("click", function () {
    if (isBigTest) {
        return;
    }
    clearInterval(ticket);
    manager.start();
    startBatch();
    isBigTest = true;
});
(function () {
    var script = document.createElement("script");
    script.onload = function () {
        var stats = new window.Stats();
        document.body.appendChild(stats.dom);
        requestAnimationFrame(function loop() {
            stats.update();
            requestAnimationFrame(loop);
        });
    };
    script.src = "//mrdoob.github.io/stats.js/build/stats.min.js";
    document.head.appendChild(script);
})();
var lbTotal = document.getElementById("lbTotal");
var lbHide = document.getElementById("lbHide");
var lbInView = document.getElementById("lbInView");
var rect = containerEl.getBoundingClientRect();
var left = rect.left,
    width = rect.width;
var right = left + width;
setInterval(function () {
    window.requestIdleCallback(function () {
        var startTime = performance.now();
        var allItems = Array.from(
            containerEl.querySelectorAll(".barrage-item")
        );
        var accCount = document.querySelectorAll(".barrage-item-acc").length;
        var len = allItems.length;
        var inHideLen = allItems.filter(function (item) {
            return item.classList.contains("hide");
        }).length;
        var inViewLen = allItems.filter(function (item) {
            var rect = item.getBoundingClientRect();
            var b =
                !item.classList.contains("hide") &&
                rect.left + rect.width >= left;
            return b;
        }).length;
        lbTotal.innerText = len + "-" + accCount;
        lbHide.innerHTML = inHideLen + "";
        lbInView.innerHTML =
            inViewLen +
            " (本次统计耗时" +
            (performance.now() - startTime).toFixed(2) +
            "ms)";
    });
}, 5000);
document.addEventListener("visibilitychange", function () {
    // 用户离开了当前页面
    if (document.visibilityState === "hidden") {
        manager.stop();
        console.log("stop....");
        // console.log(document.getElementById("frames_frame1").getBoundingClientRect())
    }
    // 用户打开或回到页面
    if (document.visibilityState === "visible") {
        manager.start();
        console.log("start....");
        // console.log(document.getElementById("frames_frame1").getBoundingClientRect())
    }
});
document.addEventListener("fullscreenchange", function () {
    console.log("fullscreenchange");
    if (!document.fullscreenElement) {
        quitFull();
        return;
    }
    goFull();
});
document.getElementById("btnFull").addEventListener("click", function (ev) {
    ev.stopPropagation();
    document.body.requestFullscreen().then(function () {
        setTimeout(function () {
            goFull();
        }, 0);
    });
});
function goFull() {
    containerEl.classList.add("fullScreen");
    videoEl.classList.add("fullScreen");
    videoEl.setAttribute("webkit-playsinline", "");
    videoEl.setAttribute("playsinline", "");
    manager.resize({
        duration: 10000,
    });
}
function quitFull() {
    containerEl.style.width = "1349px";
    containerEl.style.height = "758px";
    containerEl.classList.remove("fullScreen");
    videoEl.classList.remove("fullScreen");
    manager.resize({
        duration: 8000,
    });
}
