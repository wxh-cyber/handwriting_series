import React,{ createContext } from 'react';

//创建Context对象
const ReduxContext=createContext(null);

//实现Provider组件
export const Provider=({store,children})=>{
    return (
        <ReduxContext.Provider value={store}>
            {children}
        </ReduxContext.Provider>
    )
}

//注意context和Provider都要向外暴露！
export {ReduxContext};