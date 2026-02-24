import React,{useState} from 'react';

function Index(props){
    const [value,setValue]=useState(null);
    const {name,changeName}=props;

    return (
        <div>
            <div>Hello World,my name is {name}</div><br />
            改变name：<input type="text" onChange={(e)=>setValue(e.target.value)} />
            <button onClick={()=>changeName(value)}>确定</button>
        </div>
    )
}

export default Index;