
define(["avalon"], function() {
    /*********************************************************************
     *                      主函数                                   *
     **********************************************************************/

    var effect = avalon.fn.animate = avalon.fn.fx = function(props) {
        //avalon(elem).animate( properties [, duration] [, easing] [, complete] )
        //avalon(elem).animate( properties, options )
        var frame = new Frame(this[0])
        addOptions.apply(frame, arguments)//处理第二,第三...参数
        for (var name in props) {//处理第一个参数
            var p = avalon.cssName(name) || name
            if (name !== p) {
                props[p] = props[name] //转换为驼峰风格borderTopWidth, styleFloat
                delete props[name] //去掉连字符风格 border-top-width, float
            }
        }
        frame.props = props
        //将关键帧插入到时间轴中或插到已有的某一帧的子列队,等此帧完毕,让它再进入时间轴
        insertFrame(frame)
        return this
    }

    //分解用户的传参
    function addOptions(properties) {
        if (typeof properties === "number") { //如果第一个为数字
            this.duration = properties
        }
        //如果第二参数是对象
        for (var i = 1; i < arguments.length; i++) {
            addOption(this, arguments[i])
        }
        this.duration = typeof this.duration === "number" ? this.duration : 400//动画时长
        this.queue = !!(this.queue == null || this.queue) //是否插入子列队
        this.easing = avalon.easing[this.easing] ? this.easing : "swing"//缓动公式的名字
        this.update = true //是否能更新
        this.gotoEnd = false//是否立即跑到最后一帧
    }

    function addOption(frame, p, name) {
        if (p === "slow") {
            frame.duration = 600
        } else if (p === "fast") {
            frame.duration = 200
        } else {
            switch (avalon.type(p)) {
                case "object":
                    for (var i in p) {
                        addOption(frame, p[i], i)
                    }
                    break
                case "number":
                    frame.duration = p
                    break
                case "string":
                    frame.easing = p
                    break
                case "function"://绑定各种回调
                    name = name || "complete"
                    frame.bind(name, p)
                    break
            }
        }
    }
    /*********************************************************************
     *                          缓动公式                              *
     **********************************************************************/
    avalon.mix(effect, {
        fps: 30
    })
    var bezier = {
        "linear": [0.250, 0.250, 0.750, 0.750],
        "ease": [0.250, 0.100, 0.250, 1.000],
        "easeIn": [0.420, 0.000, 1.000, 1.000],
        "easeOut": [0.000, 0.000, 0.580, 1.000],
        "easeInOut": [0.420, 0.000, 0.580, 1.000],
        "easeInQuad": [0.550, 0.085, 0.680, 0.530],
        "easeInCubic": [0.550, 0.055, 0.675, 0.190],
        "easeInQuart": [0.895, 0.030, 0.685, 0.220],
        "easeInQuint": [0.755, 0.050, 0.855, 0.060],
        "easeInSine": [0.470, 0.000, 0.745, 0.715],
        "easeInExpo": [0.950, 0.050, 0.795, 0.035],
        "easeInCirc": [0.600, 0.040, 0.980, 0.335],
        "easeInBack": [0.600, -0.280, 0.735, 0.045],
        "easeOutQuad": [0.250, 0.460, 0.450, 0.940],
        "easeOutCubic": [0.215, 0.610, 0.355, 1.000],
        "easeOutQuart": [0.165, 0.840, 0.440, 1.000],
        "easeOutQuint": [0.230, 1.000, 0.320, 1.000],
        "easeOutSine": [0.390, 0.575, 0.565, 1.000],
        "easeOutExpo": [0.190, 1.000, 0.220, 1.000],
        "easeOutCirc": [0.075, 0.820, 0.165, 1.000],
        "easeOutBack": [0.175, 0.885, 0.320, 1.275],
        "easeInOutQuad": [0.455, 0.030, 0.515, 0.955],
        "easeInOutCubic": [0.645, 0.045, 0.355, 1.000],
        "easeInOutQuart": [0.770, 0.000, 0.175, 1.000],
        "easeInOutQuint": [0.860, 0.000, 0.070, 1.000],
        "easeInOutSine": [0.445, 0.050, 0.550, 0.950],
        "easeInOutExpo": [1.000, 0.000, 0.000, 1.000],
        "easeInOutCirc": [0.785, 0.135, 0.150, 0.860],
        "easeInOutBack": [0.680, -0.550, 0.265, 1.550],
        "custom": [0.000, 0.350, 0.500, 1.300],
        "random": [Math.random().toFixed(3),
            Math.random().toFixed(3),
            Math.random().toFixed(3),
            Math.random().toFixed(3)]
    }
    avalon.easing = {//缓动公式
        linear: function(pos) {
            return pos
        },
        swing: function(pos) {
            return (-Math.cos(pos * Math.PI) / 2) + 0.5
        }
    }
    //https://github.com/rdallasgray/bez
    //http://st-on-it.blogspot.com/2011/05/calculating-cubic-bezier-function.html
    avalon.each(bezier, function(key, value) {
        avalon.easing[key] = bezierToEasing([value[0], value[1]], [value[2], value[3]])
    })
    function bezierToEasing(p1, p2) {
        var A = [null, null], B = [null, null], C = [null, null],
                bezCoOrd = function(t, ax) {
                    C[ax] = 3 * p1[ax], B[ax] = 3 * (p2[ax] - p1[ax]) - C[ax], A[ax] = 1 - C[ax] - B[ax];
                    return t * (C[ax] + t * (B[ax] + t * A[ax]));
                },
                xDeriv = function(t) {
                    return C[0] + t * (2 * B[0] + 3 * A[0] * t);
                },
                xForT = function(t) {
                    var x = t, i = 0, z;
                    while (++i < 14) {
                        z = bezCoOrd(x, 0) - t;
                        if (Math.abs(z) < 1e-3)
                            break;
                        x -= z / xDeriv(x);
                    }
                    return x;
                };
        return function(t) {
            return bezCoOrd(xForT(t), 1);
        }
    }
    /*********************************************************************
     *                      时间轴                                    *
     **********************************************************************/
    //一个时间轴中包含许多帧, 一帧里面有各种渐变动画, 渐变的轨迹是由缓动公式所规定
    var timeline = avalon.timeline = [] 

    function insertFrame(frame) { //插入关键帧
        if (frame.queue) { //如果插入到已有的某一帧的子列队
            var gotoQueue = 1
            for (var i = timeline.length, el; el = timeline[--i]; ) {
                if (el.elem === frame.elem) { //★★★第一步
                    el.troops.push(frame) //子列队
                    gotoQueue = 0
                    break
                }
            }
            if (gotoQueue) { //★★★第二步
                timeline.unshift(frame)
            }
        } else {//插入时间轴
            timeline.push(frame)
        }
        if (insertFrame.id === null) { //时间轴只要存在帧就会执行定时器
            insertFrame.id = setInterval(deleteFrame, 1000 / avalon.fps)
        }
    }

    insertFrame.id = null

    function deleteFrame() {
        var i = timeline.length
        while (--i >= 0) {
            if (!timeline[i].paused) { //如果没有被暂停
                //如果返回false或元素不存在,就从时间轴中删掉此关键帧
                if (!(timeline[i].elem && enterFrame(timeline[i], i))) {
                    timeline.splice(i, 1)
                }
            }
        }
        //如果时间轴里面没有关键帧,那么停止定时器,节约性能
        timeline.length || (clearInterval(insertFrame.id), insertFrame.id = null)
    }

    function enterFrame(frame) {
        //驱动主列队的动画实例进行补间动画(update)，
        //并在动画结束后，从子列队选取下一个动画实例取替自身
        var now = +new Date
        if (!frame.startTime) { //第一帧
            frame.fire("before")//动画开始前做些预操作
            frame.createTweens()
            frame.build()
            frame.startTime = now
        } else { //中间自动生成的补间
            var per = (now - frame.startTime) / frame.duration
            var end = frame.gotoEnd || per >= 1 //gotoEnd可以被外面的stop方法操控,强制中止
            if (frame.update) {
                for (var i = 0, tween; tween = frame.tweens[i++]; ) {
                    tween.run(per, end)
                }
                frame.fire("step") //每执行一帧调用的回调
            }
            if (end) { //最后一帧
                frame.fire("after") //动画结束后执行的一些收尾工作
                frame.fire("complete") //执行用户回调
                if (frame.revert) { //如果设置了倒带
                    this.revertTweens()
                    delete this.startTime
                    this.gotoEnd = false

                } else {
                    var neo = frame.troops.shift()
                    if (!neo) {
                        return false
                    } //如果存在排队的动画,让它继续
                    neo.troops = frame.troops
                    insertFrame(frame)
                }
            }
        }
        return true
    }
    /*********************************************************************
     *                                  逐帧动画                            *
     **********************************************************************/
    function Frame(node) {
        this.$events = {}
        this.elem = node
        this.troops = []
        this.tweens = []
        this.orig = []
    }
    var root = document.documentElement

    Frame.isHidden = function(node) {
        return  node.sourceIndex === 0 || avalon.css(node, "display") === "none" || !avalon.contains(root, node)
    }

    Frame.prototype = {
        constructor: Frame,
        bind: function(type, fn, unshift) {
            var fns = this.$events[type] || (this.$events[type] = []);
            var method = unshift ? "unshift" : "push"
            fns[method](fn)
        },
        fire: function(type) {
            var args = Array.prototype.slice.call(arguments, 1)
            var fns = this.$events[type] || []
            for (var i = 0, fn; fn = fns[i++]; ) {
                fn.call(this.elem, args)
            }
        },
        build: function() {
            var frame = this
            var elem = frame.elem
            var props = frame.props
            var style = elem.style
            var inlineBlockNeedsLayout = !window.getComputedStyle
            //show 开始时计算其width1 height1 保存原来的width height display改为inline-block或block overflow处理 赋值（width1，height1）
            //hide 保存原来的width height 赋值为(0,0) overflow处理 结束时display改为none;
            //toggle 开始时判定其是否隐藏，使用再决定使用何种策略
            if (elem.nodeType === 1 && ("height" in props || "width" in props)) {
                //如果是动画则必须将它显示出来
                frame.overflow = [style.overflow, style.overflowX, style.overflowY]

                var display = elem.getAttribute("olddisplay")
                if (!display || display === "none") {
                    display = avalon.parseDisplay(elem.nodeName)
                    elem.setAttribute("olddisplay", display)
                }
                style.display = display

                //修正内联元素的display为inline-block，以让其可以进行width/height的动画渐变
                if (display === "inline" && avalon.css(elem, "float") === "none") {
                    if (inlineBlockNeedsLayout) { //IE
                        if (display === "inline") {
                            style.display = "inline-block"
                        } else {
                            style.display = "inline"
                            style.zoom = 1
                        }
                    }
                } else { //W3C
                    elem.style.display = "inline-block"
                }
            }
            if (frame.overflow) {
                style.overflow = "hidden"
                frame.bind("after", function() {
                    style.overflow = frame.overflow[ 0 ]
                    style.overflowX = frame.overflow[ 1 ]
                    style.overflowY = frame.overflow[ 2 ]
                    frame.overflow = null
                })
            }
            if (frame.showState === "hide") {
                frame.bind("after", function() {
                    this.style.display = "none"
                    for (var i in frame.orig) { //还原为初始状态
                        avalon.css(this, i, frame.orig[i])
                    }
                })
            }
        },
        createTweens: function() {
            var hidden = Frame.isHidden(this.elem)
            for (var i in this.props) {
                createTweenImpl(this, i, this.props[i], hidden)
            }
        },
        revertTweens: function() {
            for (var i = 0, tween; tween = this.tweens[i++]; ) {
                var start = this.start
                var end = this.end
                this.start = end
                this.end = start
            }
            this.revert = !this.revert
        }
    }

    var rfxnum = new RegExp("^(?:([+-])=|)(" + (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source + ")([a-z%]*)$", "i")

    function createTweenImpl(frame, name, value, hidden) {
        var elem = frame.elem
        var tween = new Tween(name, frame)
        var from = tween.cur() //取得起始值
        var to
        if (/color$/.test(name)) {
            //用于分解属性包中的样式或属性,变成可以计算的因子
            parts = [color2array(from), color2array(value)]
        } else {
            parts = rfxnum.exec(from)
            var unit = parts && parts[ 3 ] || (avalon.cssNumber[ name ] ? "" : "px")
            //处理 toggle, show, hide
            if (value === "toggle") {
                value = hidden ? "show" : "hide"
            }
            if (value === "show") {
                avalon.css(elem, name, 0);
                parts = [0, parseFloat(from)]
            } else if (value === "hide") {
                frame.orig[name] = from
                parts = [parseFloat(from), 0]
                value = 0;
            } else {// "18em"  "+=18em"
                parts = rfxnum.exec(value)//["+=18em", "+=", "18", "em"]
                if (parts) {
                    parts[2] = parseFloat(parts[2]) //18
                    if (parts[3] && parts[ 3 ] !== unit) {//如果存在单位，并且与之前的不一样，需要转换
                        var clone = elem.cloneNode(true)
                        clone.style.visibility = "none"
                        clone.style.position = "absolute"
                        elem.parentNode.appendChild(clone)
                        avalon.css(clone, name, parts[2] + (parts[3] ? parts[3] : 0))
                        parts[ 2 ] = parseFloat(avalon.css(clone, name))
                        elem.parentNode.removeChild(clone)
                    }
                    to = parts[2]
                    from = parseFloat(from)
                    if (parts[ 1 ]) {
                        to = from + (parts[ 1 ] + 1) * parts[ 2 ]
                    }
                    parts = [from, to]
                }
            }
        }
        from = parts[0]
        to = parts[1]
        if (from + "" !== to + "") { //不处理初止值都一样的样式与属性
            tween.start = from
            tween.end = to
            tween.unit = unit
            frame.tweens.push(tween)
        } else {
            delete frame.props[name]
        }
    }
    /*********************************************************************
     *                                 渐变动画                            *
     **********************************************************************/
    function Tween(prop, options) {
        this.elem = options.elem
        this.prop = prop
        this.easing = avalon.easing[options.easing]
        if (/color$/i.test(prop)) {
            this.update = this.updateColor
        }
    }

    Tween.prototype = {
        constructor: Tween,
        cur: function() {//取得当前值
            var hooks = Tween.propHooks[ this.prop ]
            return hooks && hooks.get ?
                    hooks.get(this) :
                    Tween.propHooks._default.get(this)
        },
        run: function(per, end) {//更新元素的某一样式或属性
            this.update(per, end)
            var hook = Tween.propHooks[ this.prop ]
            if (hook && hook.set) {
                hook.set(this);
            } else {
                Tween.propHooks._default.set(this)
            }
        },
        updateColor: function(per, end) {
            if (end) {
                var rgb = this.end
            } else {
                var pos = this.easing(per)
                rgb = this.start.map(function(from, i) {
                    return Math.max(Math.min(parseInt(from + (this.end[i] - from) * pos, 10), 255), 0)
                }, this)
            }
            this.now = "rgb(" + rgb + ")"
        },
        update: function(per, end) {
            this.now = (end ? this.end : this.start + this.easing(per) * (this.end - this.start))
        }
    }

    Tween.propHooks = {
        _default: {
            get: function(tween) {
                var result = avalon.css(tween.elem, tween.prop)
                return !result || result === "auto" ? 0 : result
            },
            set: function(tween) {
                avalon.css(tween.elem, tween.prop, tween.now + tween.unit)
            }
        }
    }

    avalon.each(["scrollTop", "scollLeft"], function(name) {
        Tween.propHooks[name] = {
            get: function(tween) {
                return tween.elem[tween.name]
            },
            set: function(tween) {
                tween.elem[tween.name] = tween.now
            }
        }
    })
    /*********************************************************************
     *                                  原型方法                            *
     **********************************************************************/

    avalon.fn.mix({
        delay: function(ms) {
            return this.animate(ms)
        },
        pause: function() {
            var cur = this[0]
            for (var i = 0, frame; frame = timeline[i]; i++) {
                if (frame.elme === cur) {
                    frame.paused = new Date - 0
                }
            }
            return this
        },
        resume: function() {
            var now = new Date
            var node = this[0]
            for (var i = 0, fx; fx = timeline[i]; i++) {
                if (fx.node === node) {
                    fx.startTime += (now - fx.paused)
                    delete fx.paused
                }
            }
            return this
        },
        //如果clearQueue为true，是否清空列队
        //如果gotoEnd 为true，是否跳到此动画最后一帧
        stop: function(clearQueue, gotoEnd) {
            clearQueue = clearQueue ? "1" : ""
            gotoEnd = gotoEnd ? "1" : "0"
            var stopCode = parseInt(clearQueue + gotoEnd, 2) //返回0 1 2 3
            var node = this[0]
            for (var i = 0, frame; frame = timeline[i]; i++) {
                if (frame.elem === node) {
                    frame.gotoEnd = true
                    switch (stopCode) { //如果此时调用了stop方法
                        case 0:
                            //中断当前动画，继续下一个动画
                            frame.update = frame.revert = false
                            break
                        case 1:
                            //立即跳到最后一帧，继续下一个动画
                            frame.revert = false
                            break
                        case 2:
                            //清空该元素的所有动画
                            delete frame.elem
                            break
                        case 3:
                            //立即完成该元素的所有动画
                            frame.troops.forEach(function(a) {
                                a.gotoEnd = true
                            })
                            break
                    }
                }
            }
            return this
        }
    })
    /*********************************************************************
     *                                 常用特效                            *
     **********************************************************************/
    var fxAttrs = [
        ["height", "marginTop", "marginBottom", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"],
        ["width", "marginLeft", "marginRight", "borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"],
        ["opacity"]
    ]
    function genFx(type, num) { //生成属性包
        var obj = {}
        fxAttrs.concat.apply([], fxAttrs.slice(0, num)).forEach(function(name) {
            obj[name] = type
            if (~name.indexOf("margin")) {
                Tween.propHooks[name] = {
                    get: Tween.propHooks._default.get,
                    set: function(tween) {
                        tween.elem.style[tween.name] = Math.max(tween.now, 0) + tween.unit
                    }
                }
            }
        })
        return obj
    }


    var effects = {
        slideDown: genFx("show", 1),
        slideUp: genFx("hide", 1),
        slideToggle: genFx("toggle", 1),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }

    avalon.each(effects, function(method, props) {
        avalon.fn[method] = function() {
            var args = [].concat.apply([props], arguments)
            return this.animate.apply(this, args)
        }
    })

    String("toggle,show,hide").replace(avalon.rword, function(name) {
        avalon.fn[name] = function() {
            var args = [].concat.apply([genFx(name, 3)], arguments)
            return this.animate.apply(this, args)
        }
    })
    /*********************************************************************
     *                      转换各种颜色值为RGB数组                            *
     **********************************************************************/
    var colorMap = {
        "black": [0, 0, 0],
        "gray": [128, 128, 128],
        "white": [255, 255, 255],
        "orange": [255, 165, 0],
        "red": [255, 0, 0],
        "green": [0, 128, 0],
        "yellow": [255, 255, 0],
        "blue": [0, 0, 255]
    }
    if (window.VBArray) {
        var parseColor = new function() {
            var body
            try {
                var doc = new ActiveXObject("htmlfile")
                doc.write("<body>")
                doc.close()
                body = doc.body
            } catch (e) {
                body = createPopup().document.body
            }
            var range = body.createTextRange()
            return function(color) {
                body.style.color = String(color).trim()
                var value = range.queryCommandValue("ForeColor")
                return [value & 0xff, (value & 0xff00) >> 8, (value & 0xff0000) >> 16]
            }
        }
    }

    function color2array(val) { //将字符串变成数组
        var color = val.toLowerCase(),
                ret = []
        if (colorMap[color]) {
            return colorMap[color]
        }
        if (color.indexOf("rgb") === 0) {
            var match = color.match(/(\d+%?)/g),
                    factor = match[0].indexOf("%") !== -1 ? 2.55 : 1
            return (colorMap[color] = [parseInt(match[0]) * factor, parseInt(match[1]) * factor, parseInt(match[2]) * factor])
        } else if (color.charAt(0) === '#') {
            if (color.length === 4)
                color = color.replace(/([^#])/g, '$1$1')
            color.replace(/\w{2}/g, function(a) {
                ret.push(parseInt(a, 16))
            })
            return (colorMap[color] = ret)
        }
        if (window.VBArray) {
            return (colorMap[color] = parseColor(color))
        }
        return colorMap.white
    }
    avalon.parseColor = color2array
    return avalon
})
