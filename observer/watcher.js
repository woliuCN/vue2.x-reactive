import {
    pushTarget, popTarget
} from './dep'

export default class Watcher {
    dirty
    getter
    value
    constructor(vm, expOrFn, cb, options) {
        this.vm = vm


        // 记录上一次求值的依赖
        this.deps = []
        // 记录当前求值的依赖
        this.newDeps = []
        this.depIds = new Set()
        this.newDepIds = new Set()

        if (typeof expOrFn === 'function') {
            this.getter = expOrFn
        } else {}

        // new watcher的时候，get方法会调用
        this.value = this.lazy ?
            undefined :
            this.get()
    }

    get() {
        pushTarget(this)
        let value
        const vm = this.vm
        try {
            // 有点不明白
            value = this.getter.call(vm, vm)
        } catch (error) {
            
        } finally {
          popTarget()
        
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


    // 清除无用的依赖
    cleanupDeps() {
        let i = this.deps.length
        while(i--) {
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