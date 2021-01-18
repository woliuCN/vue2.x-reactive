
import { initState } from './state'

let uid = 0
//　初始化的函数
export function initMixin (Vue) {
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



export function renderMixin (Vue) {
    Vue.prototype._render = function () {
        var vm = this
        var ref = vm.$options
        var render= ref.render
        
    }
}