import {useState,useEffect} from 'react';
import useDebounce from '../hooks/useDebounce';

function Index_4() {
    const [searchTerm,setSearchTerm]=useState('');
    //只有当用户停止输入500ms后，debounceSearchTerm才会更新
    const debounceSearchTerm=useDebounce(searchTerm,500);

    useEffect(()=>{
        if(debounceSearchTerm){
            console.log('发起API搜索请求：',debounceSearchTerm);
        }
    },[debounceSearchTerm]);

    return (
        <input type="text" placeholder="输入搜索..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
    )
}

export default Index_4;
