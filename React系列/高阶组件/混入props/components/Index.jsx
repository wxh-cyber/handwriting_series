import React,{useEffect} from 'react';

function Index(props){
    const {name}=props;
    
    useEffect(()=>{
        console.log('Index componentDidMount');
    },[]);

    return (
        <div>
            Hello World,my name is {name}
        </div>
    )
}

export default Index;