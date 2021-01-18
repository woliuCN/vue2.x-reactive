import { initMixin } from './init'

function Vue (options) {
    // 原型上的方法
    this._init(options)
}

initMixin(Vue)


// export default Vue