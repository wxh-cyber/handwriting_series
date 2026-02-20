import {useState,useEffect} from 'react';

//定义Hook
function useWindowSize() {
    const [windowSize,setWindowSize]=useState({
        width:window.innerWidth,
        height:window.innerHeight,
    });

    useEffect(()=>{
        //处理函数
        function handleResize(){
            setWindowSize({
                width:window.innerWidth,
                height:window.innerHeight,
            });
        }

        //监听resize事件
        window.addEventListener('resize',handleResize);

        //清理函数：组件卸载时移除监听，防止内存泄漏
        return ()=>{
            window.removeEventListener('resize',handleResize);
        }
    },[]);   //空数组表示只在挂载时执行一次

    return windowSize;
}

export default useWindowSize;