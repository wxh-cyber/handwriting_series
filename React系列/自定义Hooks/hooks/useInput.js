import {useState} from 'react';

function useInput(initialValue){
    const [value,setValue]=useState(initialValue);

    const onChange=(e)=>{
        setValue(e.target.value);
    };

    const reset=()=>setValue(initialValue);

    //返回可以直接绑定到input标签的属性对象
    return {
        bind:{
            value,
            onChange
        },
        value,
        reset
    }
}

export default useInput;