import {useState,useCallback} from 'react'

//定义Hook
function useToggle(initialValue = false) {
    const [state, setState] = useState(initialValue);

    //使用useCallback避免不必要的重渲染
    const toggle=useCallback(()=>{
        setState(prev => !prev);
    },[]);

    //提供显式设置true/false的方法
    const setTrue=useCallback(()=>setState(true),[]);
    const setFalse=useCallback(()=>setState(false),[]);

    return {
        state,
        toggle,
        setTrue,
        setFalse,
    }
}

export default useToggle;
