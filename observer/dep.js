export default class Dep {
    constructor() {
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
}


Dep.target = null
const targetStack = []

// 依赖采集数组
// Dep.target都是一个Watcher
export function pushTarget(target) {
    targetStack.push(target)
    Dep.target = target
}


export function popTarget() {
    targetStack.pop()
    Dep.target = targetStack[targetStack.length - 1]
}


export function remove (arr, item) {
    if (arr.length) {
      var index = arr.indexOf(item);
      if (index > -1) {
        return arr.splice(index, 1)
      }
    }
}