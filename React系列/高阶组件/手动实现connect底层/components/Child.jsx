import React, {useState, useEffect} from 'react';
import {connect} from '../redux/connect'

function Child(props) {
    const {count,user}=props;
    const {add,sub,changeUser}=props;

    // 使用useState创建本地状态来管理输入框的值
    const [inputValue, setInputValue] = useState(user);
    const [isEditing, setIsEditing] = useState(false);
    
    // 当Redux中的user改变时，同步更新输入框
    useEffect(() => {
        setInputValue(user);
    }, [user]);
    
    // 处理输入框变化
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setIsEditing(true);
    };
    
    // 处理提交
    const handleSubmit = () => {
        changeUser(inputValue);
        setIsEditing(false);
    };
    
    // 处理键盘事件（按Enter键提交）
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };
    
    // 取消编辑
    const handleCancel = () => {
        setInputValue(user);
        setIsEditing(false);
    };

    return (
        <div>
            <h3>当前的值为：{count}</h3>
            <h3>当前的用户为：{user}</h3>
            <button onClick={add}>点我+1</button>
            <button onClick={sub}>点我-1</button>
            <br />
            <br />
            <div>
                <label>用户名修改（响应式）：</label>
                <input 
                    type="text" 
                    value={inputValue} 
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder="请输入用户名" 
                />
                <button onClick={handleSubmit} disabled={!isEditing}>确认修改</button>
                {isEditing && (
                    <button onClick={handleCancel}>取消</button>
                )}
            </div>
            {isEditing && (
                <div style={{marginTop: '10px', color: '#666'}}>
                    预览: {inputValue}
                </div>
            )}
        </div>
    )
}

const mapStateToProps=(state)=>({count:state.count,user:state.user});
const mapDispatchToProps=(dispatch)=>({
    add:()=>dispatch({type:'ADD'}),
    sub:()=>dispatch({type:'SUB'}),
    changeUser:(user)=>dispatch({type:'CHANGE_USER',payload:user})
});

//使用手写的connect
export default connect(mapStateToProps,mapDispatchToProps)(Child);