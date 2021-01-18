import { observe } from "../observer"

export function initState(vm) {
    const opts = vm.$options
    if (opts.data) {
        initData(vm)
    }
    if (opts.computed) initComputed(vm, opts.computed)
    if (opts.watch) {
        initWatch(vm, opts.watch)
    }
}


// 将值转换为被劫持的后值
function initData(vm) {
    let data = vm.$options.data
    // 这里假设data就是个返回了对象的函数,实际这里做了很多判断
    data = vm._data = data.call(vm, vm)
    // 这里获取key　做个while循环, 其实是后面获取了option中的props与methods　做了重名的判断，这里假设不会有这种情况
    // const keys = Object.keys(data)
    observe(data, true)
}



function initComputed(vm, computed) {
    
}


function initWatch(vm, watch) {
    
}
