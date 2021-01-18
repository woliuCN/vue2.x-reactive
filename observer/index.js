import Dep from "./dep"

export class Observer {
    constructor(value) {
        this.value = value
        //　这里的dep是给数组的每一个值依赖收集的
        this.dep = new Dep()
        def(value, '__ob__', this)
        // 如果值是数组的话需要额外处理，因为object.defineProperty　不能监听数组
        if (Array.isArray(value)) {

        } else {
            // 否则就遍历对象，为对象的属性进行劫持
            this.walk(value)
        }
    }

    walk(obj) {
        const keys = Object.keys(obj)
        for (let i = 0; i < keys.length; i++) {
            defineReactive(obj, keys[i])
        }
    }
}

// 每个key对应个dep

// 属性劫持　val是手动set的时候传值，默认情况下是不需要的
export function defineReactive(obj, key, val) {
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

    //先假设对象只有一层
    Object.defineProperty(obj, key, {
        // 可遍历，可修改
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            const value = getter ? getter.call(obj) : val

            if (Dep.target) {
                // 依赖收集
                dep.depend()
            }
            return value
        }
    })
}


// 将对象的value变成一个observe 实例
export function observe(value, asRootData) {
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
export function set() {}


// 手动del方法
export function del() {}


export function isObject (obj) {
    return obj !== null && typeof obj === 'object'
}


export function def (obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
      value: val,
      enumerable: !!enumerable,
      writable: true,
      configurable: true
    })
}