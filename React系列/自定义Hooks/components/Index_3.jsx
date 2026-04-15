import useFetch from '../hooks/useFetch';

function Index_3(){
    const {data,loading,error}=useFetch('https://jsonplaceholder.typicode.com/todos/1');

    if(loading) return <div>加载中...</div>
    if(error) return <div>错误：{error.message}</div>

    return (
        <div>
            <h1>{data.title}</h1>
            <p>完成状态：{data.completed?'已完成':'未完成'}</p>
        </div>    
    )
}

export default Index_3;
