//手写Mini-redux
/**
 * 创建store的工厂函数
 * @param {Function} reducer - 根据旧state和action计算新state的纯函数
 * @param {any} preloadedState - 初始状态（可选）
 */
export default function createStore(reducer,preloadedState){
    //1.存储状态
    //如果没有传入初始状态，这里先 undefined，后面初始化时会由 reducer 赋予默认值
    let currentState=preloadedState;

    //2.存储订阅者（监听器）
    //这是一个数组，存放所有的回调函数（也就是 connect 中传入的回调）
    let currentListeners=[];

    //获取当前状态的函数
    function getState(){
        return currentState;
    }

    /**
     * 订阅状态变化
     * @param {Function} listener - 当状态变化时调用的回调函数
     * @return {Function} unsubscribe - 取消订阅的函数
     */
    function subscribe(listener){
        //将新的监听器添加到数组中
        currentListeners.push(listener);

        //返回一个取消订阅的函数
        return function unsubscribe(){
            //通过过滤数组，移除当前的listener
            const index=currentListeners.indexOf(listener);
            if(index>-1){
                currentListeners.splice(index,1);
            }
        }
    }
    
    /**
     * 派发动作，触发状态更新
     * @param {Object} action - 描述状态变化的对象，必须有一个 type 属性
     */
    function dispatch(action){
        //1.使用reducer计算新的状态
        //将当前状态和动作传给 reducer，得到返回值作为新状态
        currentState=reducer(currentState,action);

        //2.通知所有订阅者状态已经更新
        //遍历 currentListeners 数组，依次调用每个监听器函数
        currentListeners.forEach(listener=>listener());

        return action;
    }

    //3.初始化状态
    //创建store时，默认派发一个随机的action
    //目的是为了让 reducer 返回其定义的默认 state (default case)
    dispatch({type:`@@redux/INIT${Math.random()}`});

    //暴露store的API
    return {
        getState,
        subscribe,
        dispatch
    };
}