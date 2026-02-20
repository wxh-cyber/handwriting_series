import useInput from '../hooks/useInput';

function Index_5() {
    const {bind:bindName,reset:resetName}=useInput('');
    const {bind:bindPassword,reset:resetPassword}=useInput('');

    const handleSubmit=(e)=>{
        e.preventDefault();
        console.log(bindName.value,bindPassword.value);
        resetName();
        resetPassword();
    }

    return (
        <form onSubmit={handleSubmit}>
            {/* 使用拓展运算符直接绑定 */}
            <input type="text" placeholder="请输入用户名" {...bindName} />
            <input type="password" placeholder="请输入密码" {...bindPassword} />
            <button type="submit">提交</button>
        </form>
    )
}

export default Index_5;
