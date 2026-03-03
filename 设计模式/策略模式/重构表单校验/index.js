/**
 * @description: 重构表单校验
*/
var strategies={
    isNonEmpty:function(value,errorMsg){       //不为空
        if(value===''){
            return errorMsg;
        }
    },

    minLength:function(value,length,errorMsg){       //最小长度
        if(value.length<length){
            return errorMsg;
        }
    },

    isMobile:function(value,errorMsg){       //手机号码校验
        if(!/^1[3456789]\d{9}$/.test(value)){
            return errorMsg;
        }
    }
};

var validataFunc=function(){
    var validator=new Validator();    //创建一个validator对象

    /*******添加一些校验规则*******/
    validator.add(registerForm.username,'isNonEmpty','用户名不能为空');
    validator.add(registerForm.password,'minLength:6','密码长度不能少于6位');
    validator.add(registerForm.phoneNumber,'isMobile','手机号码格式不正确');

    var errorMsg=validator.start();    //开始校验并获取校验结果
    return errorMsg;                   //返回校验结果
};

var registerForm=document.getElementById('registerForm');
registerForm.onsubmit=function(){
    var errorMsg=validataFunc();    //获取校验结果
    if(errorMsg){                  //如果有校验错误
        alert(errorMsg);           //提示错误信息
        return false;              //阻止表单提交
    }

    /**
     * Live Server的限制：Live Server只是一个简单的静态文件服务器。它只支持GET请求，不支持POST请求。
     */
    alert("校验通过，开始提交数据（模拟）"); 
    return false; // 关键：校验通过后，也要阻止表单默认提交，否则会报 405
};

var Validator=function(){
    this.cache=[];    //保存校验规则的数组
}

Validator.prototype.add=function(dom,rule,errorMsg){
    var ary=rule.split(':');             //把strategy和参数分开
    this.cache.push(function(){          //把校验的步骤用空函数包装起来，并放入cache
        var strategy=ary.shift();        //从数组开头取出strategy
        ary.unshift(dom.value);          //把input的value添加进参数列表
        ary.push(errorMsg);              //把errorMsg添加进参数列表
        return strategies[strategy].apply(dom,ary);
    });
};

Validator.prototype.start=function(){
    for(var i=0,validatorFunc;validatorFunc=this.cache[i++];){
        var errorMsg=validatorFunc();       //开始校验，并取得校验后的返回信息
        if(errorMsg){               //如果有确切的返回值，说明校验没有通过
            return errorMsg;
        }
    }
}
