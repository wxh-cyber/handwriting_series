import React,{useState,useContext,useLayoutEffect} from 'react';
import { ReduxContext } from '../context/ReduxContext';
import store from '../redux/index.js';

//从store中解构出向外暴露的方法
const {subscribe,dispatch}=store; // getState暂时不需要

/**
 * connect函数的实现
 * @param {Function} mapStateToProps 将store中的state映射为组件的props
 * @param {Function} mapDispatchToProps 将store中的dispatch方法映射为组件的props
 * 
 */

export const connect=(mapStateToProps,mapDispatchToProps)=>(WrapComponent)=>{

    //返回一个新的组件
    return function ConnectComponent(props){
        //1.从Context中获取store
        const store=useContext(ReduxContext);

        //2.保存当前的props状态，用于触发更新
        //这里使用useState来强制更新组件
        const [,forceUpdate]=useState({});

        //3.计算stateProps（将Redux state映射为props）
        //注意：这里需要传入store.getState()和组件自身的props
        const stateProps=mapStateToProps?mapStateToProps(store.getState(),props):{};

        //4.计算dispatchProps（将dispatch映射为props）
        let dispatchProps={};
        if(typeof mapDispatchToProps==='function'){
            dispatchProps=mapDispatchToProps(store.dispatch,props);
        }else if(typeof mapDispatchToProps==='object'){
            //如果传入的是对象，React-redux会自动用dispatch包裹
            dispatchProps=bindActionCreators(mapDispatchToProps,dispatch);
        }else{
            //默认注入dispatch
            dispatchProps={dispatch};
        }

        //5.订阅store的变化（核心逻辑）
        //使用useLayoutEffect来订阅store的变化，确保在DOM更新前触发更新，防止丢失更新
        useLayoutEffect(()=>{
            //订阅函数：当store变化时执行
            const unsubscribe=subscribe(()=>{
                //获取最新的state
                // const nextState=getState(); // 暂时不需要，后续可用于性能优化

                //性能优化：浅比较（Shallow Comparsion）
                //在真实的React-redux中，会比较mapStateToProps计算出的新旧props是否变化
                //如果没变化，就不更新。这里只是一个基础比较
                //简单触发更新
                forceUpdate({});
            });

            //组件卸载时取消订阅
            return ()=>{
                unsubscribe();
            }
        },[store]);

        //6.渲染被包裹组件，合并所有的props
        return <WrapComponent {...stateProps} {...dispatchProps} {...props} />
    }
};

//辅助函数：简化版的bindActionCreators
//如果mapDispatchToProps是一个对象{add:()=>({type:'ADD'})}
//{add:()=>dispatch({type:'ADD'})}
function bindActionCreators(creators,dispatch){
    const bound={};
    Object.keys(creators).forEach(key=>{
        const creator=creators[key];
        bound[key]=(...args)=>dispatch(creator(...args));
    });

    return bound;
}