import {useState,useEffect} from 'react';

//定义Hook
function useDebounce(value,delay){
    const [debounceValue,setDebounceValue]=useState(value);

    useEffect(()=>{
        //设置定时器，延迟更新值
        const handler=setTimeout(()=>{
            setDebounceValue(value);
        },delay);

        //如果在delay的时间内value再次变化，useEffect会重新执行
        //这里的return会先清理掉上一个定时器
        return ()=>{
            clearTimeout(handler);
        }
    },[value,delay]);

    return debounceValue;
}

export default useDebounce;