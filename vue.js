function proxy(obj, source, target) {
    Object.defineProperty(obj, target, {
        configurable: true,
        enumerable: true,
        get() {
            return obj[source][target];
        },
        set(newVal) {
            obj[source][target] = newVal;
        }
    });
}

function Vue(options) {
    // 原型上的方法
    this._init(options)
}
Vue.prototype.$mount = function (
    el,
    hydrating
) {
    return mountComponent(this, el, hydrating)
};


Vue.prototype._update = function (node, hydrating) {
    hydrating.innerHTML = node
}

initMixin(Vue)
stateMixin(Vue)
renderMixin(Vue)





function mountComponent(vm, el, hydrating) {
    vm.$el = el;
    const _updateComponent = function (vm) {
        vm._update(vm._render(), hydrating)
    }
    // 没错就是在这里，_updateComponent就是我们的更新视图的方法
    // 因为这里因为没设置lazy，所以实例化watcher的时候，会直接调用
    // _updateComponent -> _render -> 渲染页面 
    new Watcher(vm, _updateComponent, noop, {}, true)
    return vm
}


let uid = 0
//　初始化的函数
function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        const vm = this
        // 每个实例的都有自己的id
        vm._uid = uid++
        vm.$options = options
        vm._self = vm
        initState(vm)
        if (vm.$options.el) {
            vm.$mount(vm.$options.el)
        }
    }

}

function stateMixin(Vue) {
    Vue.prototype.$watch = function(expOrFn, cb, options) {
        const vm = this
        options = options || {}
        // watcher 里面的user就是给watch用的
        options.user = true
        const watcher = new Watcher(vm, expOrFn, cb, options)
        // 如果watch配置了立马获取值的话
        if (options.immediate) {
            try {
                cb.call(vm, watcher.value, null)
            } catch (error) {
                
            }
        }
    }
}

function initState(vm) {
    // destory的时候用
    vm._watchers = [];
    const opts = vm.$options
    if (opts.data) {
        initData(vm)
    }
    if (opts.computed) initComputed(vm, opts.computed)
    if (opts.watch) {
        initWatch(vm, opts.watch)
    }
}


// 将值转换为被劫持后的值
function initData(vm) {
    let data = vm.$options.data
    // 这里假设data就是个返回了对象的函数,实际这里做了很多判断
    data = vm._data = data.call(vm, vm)
    const keys = Object.keys(data);
    // 将 _data 的数据代理到 this 上
    for (let i = 0; i < keys.length; i++) {
        proxy(vm, '_data', keys[i]);
    }
    // 正常做个会有while循环, 其实是后面获取了option中的props与methods　做了重名的判断，这里假设不会有这种情况

    observe(data, true)
}

const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
}

function initComputed(vm, computed) {
    // 计算属性的wacher对象
    const watchers = vm._computedWatchers = Object.create(null)

    for (const key in computed) {
        const userDef = computed[key]
        // 因为compouted有函数形式或者 set/get方式的
        const getter = typeof userDef === 'function' ? userDef : userDef.get
        watchers[key] = new Watcher(
            vm,
            getter || noop,
            noop,
            { lazy: true }
        )
        if (!(key in vm)) {
            defineComputed(vm, key, userDef)
        }
    }
}

function defineComputed(target, key, userDef) {
    // 暂时默认不是服务端渲染
    // const shouldCache = !isServerRendering()
    if (typeof userDef === 'function') {
        sharedPropertyDefinition.get = createComputedGetter(key)
        sharedPropertyDefinition.set = noop
    } else {
        sharedPropertyDefinition.get = createComputedGetter(key)
        sharedPropertyDefinition.set = userDef.set || noop
    }
    Object.defineProperty(target, key, sharedPropertyDefinition)
}


function createComputedGetter(key) {
    return function computedGetter() {
        const watcher = this._computedWatchers && this._computedWatchers[key]
        if (watcher) {
            // 这里一开始new的时候 dirty 是为true的
            // 只要不取值，第一次，computed 值因为 dirty 是true所以是 undefined
            // 没必要一开始就算出其值(浪费)，只有取值了才会调用 evaluate 重新计算值。
            if (watcher.dirty) {
                // 调用evaluate计算值，计算完后会置为false
                // 除非依赖的数据发生改变，会将 dirty 置为true 否则都无需取计算
                watcher.evaluate()
            }
            // 这里是依赖收集暂时不知道作用是什么
            if (Dep.target) {
                watcher.depend()
            }
            return watcher.value
        } 
    }
}

function initWatch(vm, watch) {
    for (const key in watch) {
        // 这是user定义的回调
        const handler = watch[key]
        createWatcher(vm, key, handler)
    }
}


function createWatcher(vm, expOrFn, handler, options) {
    // 针对watch值是对象的情况
    if(isPlainObject(handler)) {
        options = handler
        handler = handler.handler
    }
    return vm.$watch(expOrFn, handler, options)
}

// 为了防止重复依赖收集
const seenObjects = new Set()

// 遍历wach的deep对象的值，进行依赖收集，这样才能实现deep
function traverse(val) {
    _traverse(val,seenObjects)
    seenObjects.clear()
}

function _traverse (val, seen) {
    let i, keys
    const isA = Array.isArray(val)
    if ((!isA && !isObject(val))) {
      return
    }
    if (val.__ob__) {
      const depId = val.__ob__.dep.id
      if (seen.has(depId)) {
        return
      }
      seen.add(depId)
    }
    if (isA) {
      i = val.length
      while (i--) _traverse(val[i], seen)
    } else {
      keys = Object.keys(val)
      i = keys.length
      while (i--) _traverse(val[keys[i]], seen)
    }
}





function renderMixin(Vue) {
    Vue.prototype._render = function () {
        var vm = this
        var ref = vm.$options
        var render = ref.render
        var vNode = render.call(vm, vm)
        return vNode
    }
}



function VNode(params) {

}


let depId = 0
class Dep {
    constructor() {
        this.id = depId++
        this.subs = []
    }
    removeSub(sub) {
        // 这里的sub是watcher
        remove(this.subs, sub)
    }
    addSub(sub) {
        this.subs.push(sub)
    }
    depend() {
        if (Dep.target) {
            Dep.target.addDep(this)
        }
    }

    notify() {
        const subs = this.subs.slice()
        for (let i = 0, l = subs.length; i < l; i++) {
            subs[i].update()
        }
    }
}


Dep.target = null
const targetStack = []

// 依赖采集数组
// Dep.target都是一个Watcher
function pushTarget(target) {
    targetStack.push(target)
    Dep.target = target
}

function popTarget() {
    targetStack.pop()
    Dep.target = targetStack[targetStack.length - 1]
}


function remove(arr, item) {
    if (arr.length) {
        var index = arr.indexOf(item);
        if (index > -1) {
            return arr.splice(index, 1)
        }
    }
}




class Observer {
    constructor(value) {
        this.value = value
        //　这里的dep是给数组依赖收集的
        this.dep = new Dep()

        // 这里的def代理的__ob__很重要，后面数组就会用到这上面代理的observer对象
        def(value, '__ob__', this)
        // 如果值是数组的话需要额外处理，因为object.defineProperty 无法监听数组的任何改变数组长度的操作，以及原型上的方法。
        // 这也是为什么尤大不对数组进行处理的原因，而是通过$set与代理变异方法来实现
        if (Array.isArray(value)) {
            // 代理数组的变异方法，重新赋值原型
            value.__proto__ = arrayMethods
            this.observeArray(value)
        } else {
            // 否则就遍历对象，为对象的属性进行劫持
            this.walk(value)
        }
    }
    // 监听对象
    walk(obj) {
        const keys = Object.keys(obj)
        for (let i = 0; i < keys.length; i++) {
            defineReactive(obj, keys[i])
        }
    }
    // 监听数组的每一项，即arr[i].xxxx = xxx的时候可以监听到，就是因为这里，但不会监听到arr[i] = xxx
    observeArray(array) {
        for (let i = 0; i < array.length; i++) {
            observe(array[i])
        }
    }
}


// 每个key对应一个dep
// 属性劫持　val是手动set的时候传值，默认情况下是不需要的
function defineReactive(obj, key, val) {
    const dep = new Dep()

    // 获取对象属性的描述对象
    const property = Object.getOwnPropertyDescriptor(obj, key)
    // 如果对象的值之前被设置过了，且设置为不可更改值，即无需监听
    if (property && property.configurable === false) {
        return
    }



    // 如果原本的对象的属性定义了对应的get与set，应该与其保持一致
    const getter = property && property.get
    const setter = property && property.set
    // 非set的情况下，没有定义get，即这时候val会是Undefined，需要赋予其原本的值
    if ((!getter || setter) && arguments.length === 2) {
        val = obj[key]
    }
    // 递归进行依赖收集
    let ob = observe(val)
    Object.defineProperty(obj, key, {
        // 可遍历，可修改
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            const value = getter ? getter.call(obj) : val
            if (Dep.target) {
                // 依赖收集
                dep.depend()
                // 如果val是个对象或者是个数组的时候，ob是个observe对象
                // 如果是数组的话，通过ob.dep.depend来进行数组方法的依赖收集
                if (ob) {
                    ob.dep.depend()
                    if (Array.isArray(value)) {
                        // 这里为什么需要呢，前面的ob.dep.depend只是对最外层的数组的方法进行的依赖收集
                        // 但是考虑到值如果也是数组的情况，即多维数组的依赖的收集
                        dependArray(value)
                    }
                }
            }
            return value
        },
        set: function reactiveSetter(newVal) {
            const value = getter ? getter.call(obj) : val
            if (newVal === value) return
            // 如果对象属性是不能被设置的
            if (getter && !setter) return
            if (setter) {
                setter.call(obj, newVal)
            } else {
                val = newVal
            }
            // 新数据递归进行响应式处理
            ob = observe(newVal)
            // 通知数据更新
            dep.notify()
        }
    })
}


// 将对象的value变成一个observe 实例
function observe(value, asRootData) {
    // 如果不是个对象或者是个虚拟dom节点的　无需观测
    if (!isObject(value) || value instanceof VNode) {
        return
    }
    let obj
    // 如果已经被观测了，则无需再实例化
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
        obj = value.__ob__
    } else {
        obj = new Observer(value)
    }

    return obj
}



// 手动set方法
function set() { }


// 手动del方法
function del() { }


function isObject(obj) {
    return obj !== null && typeof obj === 'object'
}

// 属性代理
function def(obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        writable: true,
        configurable: true
    })
}

// 多维数组的方法依赖收集
function dependArray(array) {
    for (let i = 0; i < array.length; i++) {
        const element = array[i];
        // 这里的__obj__就是前面def发挥的作用
        element && element.__ob__ && element.__ob__.dep.depend()
        if (Array.isArray(element)) {
            dependArray(element)
        }
    }
}



const arrayMethods = Object.create(Array.prototype)
// 数组的变异方法
const methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
]

// 这里是编译方法进行劫持
methodsToPatch.forEach((method) => {
    // 数组的原方法
    const original = arrayMethods[method]
    // 这里不能用箭头
    def(arrayMethods, method, function (...args) {
        const result = original.apply(this, args)
        const ob = this.__ob__
        // push/unshift/splice的值
        let inserted
        switch (method) {
            case 'push':
            case 'unshift':
                inserted = args
                break
            case 'splice':
                inserted = args.slice(2)
                break
        }
        // 对新增的值进行依赖收集
        if (inserted) ob.observeArray(inserted)
        // 变化通知
        ob.dep.notify()
        return result
    })
})


let wId = 0

class Watcher {
    dirty
    getter
    cb
    value
    // vm 为vue实例对象
    // expOrFn为更新的方法, renderWatcher中为我们的updateComponent更新视图, userWatcher/computedWatcher为重新求值方法
    // cb 为回调，主要在userWatcher中及我们的watch属性才需要用到
    constructor(vm, expOrFn, cb, options, isRenderWatcher) {
        this.vm = vm
        if (isRenderWatcher) {
            vm._watcher = this
        }
        vm._watchers.push(this)
        this.id = ++wId
        this.cb = cb
        // 记录上一次求值的依赖
        this.deps = []
        // 记录当前求值的依赖
        this.newDeps = []
        this.depIds = new Set()
        this.newDepIds = new Set()
        // options　lazy是computedWatcher的参数，　user则是userWatcher的参数
        if (options) {
            this.deep = !!options.deep
            this.user = !!options.user
            this.lazy = !!options.lazy
            this.sync = !!options.sync
        } else {
            this.deep = this.user = this.lazy = this.sync = false
        }
        this.dirty = this.lazy
        if (typeof expOrFn === 'function') {
            this.getter = expOrFn
        } else {
            // 如果是watch
            this.getter = parsePath(expOrFn)
        }

        // renderWatcher　userWatcher new watcher的时候，get方法会调用
        // 如果是computeWatcher　this.lazy为true, get方法不会被调用 
        this.value = this.lazy ?
            undefined :
            this.get()
    }

    get() {
        pushTarget(this)
        let value
        const vm = this.vm
        try {
            // 这里的getter 对于renderWatcher是updateComponent方法，在watch就是其对应的key, computed对应的方法
            value = this.getter.call(vm, vm)
        } catch (error) {

        } finally {
            // 这个是为watch的deep服务的
            // 如果deep的话需要递归遍历其watch的data属性的其下的所有子属性
            // 将当前的userWatcher加入到它们的dep中，这样才能深度改变
            if (this.deep) {
                traverse(value)
            }
            popTarget()
            this.cleanupDeps()

        }
        return value
    }

    // 将自己添加到dep里面
    addDep(dep) {
        const id = dep.id
        // 这里两个dep作用是为了防止重复收集依赖
        if (!this.newDepIds.has(id)) {
            this.newDepIds.add(id)
            this.newDeps.push(dep)
            if (!this.depIds.has(id)) {
                dep.addSub(this)
            }
        }
    }
    // 将现有的所有依赖加入
    depend() {
        let i = this.deps.length
        while (i--) {
            this.deps[i].depend()
        }
    }
    update() {
        // 对于computed数据来说，初始化 computedWatcher lazy是为true，且一直是true
        // 所以 computedWatcher 不会执行run ,而是依靠其计算方法中的data的属性值改变的时触发其computedWatcher，将dirty置为true。
        // 在我们对计算属性进行取值操作的时候，会因为dirty为true，从而调用evaluate获得最新的值。(这是一个很巧妙的设计，等到用到的才会最终去计算取值)
        // 又会调用到evaluate 获取到正确的值
        if (this.lazy) {
            this.dirty = true
        } else if (this.sync) {
            this.run()
        } else {
            queueWatcher(this)
        }
    }

    evaluate() {
        this.value = this.get()
        this.dirty = false
    }

    run() {
        const value = this.get()
        if (value !== this.value || isObject(value) || this.deep) {
            const oldValue = this.value
            this.value = value
            this.cb.call(this.vm, value, oldValue)
        }
    }

    // 清除无用的依赖
    cleanupDeps() {
        let i = this.deps.length
        while (i--) {
            const dep = this.deps[i]
            //　如果当前的新的依赖列表里面没有，旧的依赖有的情况，就需要解除依赖收集
            if (!this.newDepIds.has(dep.id)) {
                dep.removeSub(this)
            }
        }

        // 当前的依赖列表作为上一次依赖列表，然后重置当前的依赖列表
        let tmp = this.depIds
        this.depIds = this.newDepIds
        this.newDepIds = tmp
        this.newDepIds.clear()
        tmp = this.deps
        this.deps = this.newDeps
        this.newDeps = tmp
        this.newDeps.length = 0
    }
}
let waiting = false
let has = {}
// 缓存watcher数组
const queue = []

// 缓存在一次更新中的watcher
function queueWatcher(watcher) {
    const id = watcher.id
    if (!has[id]) {
        has[id] = true
        queue.push(watcher)
        if (!waiting) {
            waiting = true
            nextTick(flushSchedulerQueue)
        }
    }
}

let index = 0
// flushScheduleQueue函数的作用主要是执行更新的操作
// 它会把queue中所有的watcher取出来并执行相应的更新     
function flushSchedulerQueue() {
    flushing = true
    let watcher, id
    queue.sort((a, b) => a.id - b.id)
    for (index = 0; index < queue.length; index++) {
        watcher = queue[index]
        if (watcher.before) {
            watcher.before()
        }
        id = watcher.id
        has[id] = null
        watcher.run()
    }
    resetSchedulerState()
}


function resetSchedulerState() {
    index = queue.length = 0
    has = {}
    waiting = flushing = false
}

// 一般callback都是只有flushSchedulerQueue
// 当我们自己定义了$nextTick的时候也会加入到这里
const callbacks = []
let pending = false

function nextTick(cb, ctx) {
    callbacks.push(() => {
        if (cb) {
            try {
                cb.call(ctx)
            } catch (e) {
            }
        }
    })
    // 防止重复执行
    if (!pending) {
        pending = true
        timerFunc()
    }
}

// 这里我们默认浏览器支持promise，其源码判断很多种情况
const p = Promise.resolve()
let timerFunc = () => {
    p.then(flushCallbacks)
}


function flushCallbacks() {
    pending = false
    const copies = callbacks.slice(0)
    callbacks.length = 0
    for (let i = 0; i < copies.length; i++) {
        copies[i]()
    }
}




const hasOwnProperty = Object.prototype.hasOwnProperty

function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key)
}

function noop(a, b, c) {}

// 解析watch 的 a.b.c的情况
function parsePath(path) {
    const segments = path.split('.');
    return function (obj) {
    // 这里的obj会被赋予vm，所以返回的就是watch的data中key的值
      for (let i = 0; i < segments.length; i++) {
        if (!obj) { return }
        obj = obj[segments[i]];
      }
      return obj
    }
}

function isPlainObject (obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
}