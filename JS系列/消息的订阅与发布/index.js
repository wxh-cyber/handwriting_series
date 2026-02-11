export default class EventEmitter {
    constructor() {
        //创建一个容器，用来存储事件和回调函数
        // 结构类似于: { 'click': [fn1, fn2], 'change': [fn3] }
        this.events = {};
    }

    /**
    * 订阅事件
    * @param {String} type 事件名称
    * @param {Function} callback 回调函数
    */
    on(type, callback) {
        //如果该事件还没有被订阅过，初始化一个数组
        if (!this.events[type]) {
            this.events[type] = [];
        }
        //将回调函数推入数组中，等待触发
        this.events[type].push(callback);
    }

    /**
     * 发布/触发事件（emit）
     * @param {String} type 事件名称
     * @param {...any} args 传递给回调函数的参数
     */
    emit(type, ...args) {
        //如果该事件有订阅者
        if(this.events[type]){
            //遍历数组，依次执行所有回调函数
            this.events[type].forEach(callback => callback.apply(this, args));
        }
    }

    /**
     * 取消订阅事件
     * @param {String} type 事件名称
     * @param {Function} callback 要移除的具体回调函数
     */
    off(type, callback) {
        //如果没有订阅过，直接返回
        if(!this.events[type]) return;
        //过滤掉要移除的那个函数，保留其他的
        this.events[type]=this.events[type].filter((item)=>{
            //这里考虑到在移除一次时，传递的是包装函数wrapper，为了能够准确移除，所以也会同时判断wrapper的fn属性是否等于原函数
            item!==callback&&item.fn!==callback;
        });
    }

    /**
     * 只订阅一次（once）
     * @param {String} type 事件名称
     * @param {Function} callback 回调函数 
     */
    once(type, callback) {
        //创建一个包装函数
        const wrapper=(...args)=>{
             //执行原回调
             callback.apply(this, args);
             //立即取消订阅
             this.off(type, wrapper);
        }

        //为了防止在还没执行前，用户就调用off移除，需要把原函数挂载到wrapper上
        //这样off方法里的filter才能通过属性比对找到正确的函数（进阶细节）
        wrapper.fn=callback;
        //注册这个包装函数
        this.on(type, wrapper);
    }
}

