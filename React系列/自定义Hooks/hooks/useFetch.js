import {useState,useEffect} from 'react';

function useFetch(url) {
    const [data,setData]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState(null);

    useEffect(()=>{
        const fetchData=async ()=>{
            setLoading(true);

            try{
                const response=await fetch(url);
                if(!response.ok){
                    throw new Error(`HTTP error! status:${response.status}`);
                }
                const json=await response.json();
                setData(json);
                setError(null);
            }catch(err){
                setError(err);
            }finally{
                setLoading(false);
            }
        };

        fetchData();
    },[url]);     //url变化时，重新请求

    return {data,loading,error};
}

export default useFetch;