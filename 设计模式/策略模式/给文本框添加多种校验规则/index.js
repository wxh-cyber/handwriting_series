/**
 * @description 给文本框添加多种校验规则
 */

/********策略对象********/
var strategies = {
  isNonEmpty: function (value, errorMsg) {
    //不为空
    if (value === "") {
      return errorMsg;
    }
  },

  minLength: function (value, length, errorMsg) {
    //最小长度
    if (value.length < length) {
      return errorMsg;
    }
  },

  isMobile: function (value, errorMsg) {
    //手机号码校验
    if (!/^1[3456789]\d{9}$/.test(value)) {
      return errorMsg;
    }
  },
};

/********Validator类********/
var Validator = function () {
  this.cache = []; //保存校验规则的数组
};

Validator.prototype.add = function (dom, rules) {
  var self = this;

  for (var i = 0, rule; (rule = rules[i++]); ) {
    (function (rule) {
      var strategyAry = rule.strategy.split(":"); //strategyAry:[strategy,params]
      var errorMsg = rule.errorMsg;

      self.cache.push(function () {
        var strategy = strategyAry.shift(); //从数组开头取出strategy
        strategyAry.unshift(dom.value); //把input的value添加进参数列表头部
        strategyAry.push(errorMsg); //把errorMsg添加进参数列表尾部
        return strategies[strategy].apply(dom, strategyAry);
      });
    })(rule);
  }
};

Validator.prototype.start = function () {
  for (var i = 0, validatorFunc; (validatorFunc = this.cache[i++]); ) {
    var errorMsg = validatorFunc(); //开始校验，并取得校验后的错误信息
    if (errorMsg) {
      //如果有错误信息，说明校验没有通过
      return errorMsg;
    }
  }
};

/********客户调用代码********/
var validataFunc = function () {
  var validator = new Validator();

  validator.add(registerForm.userName, [
    {
      strategy: "isNonEmpty",
      errorMsg: "用户名不能为空",
    },
    {
      strategy: "minLength:6",
      errorMsg: "用户名长度不能小于10位",
    },
  ]);

  validator.add(registerForm.password, [
    {
      strategy: "minLength:6",
      errorMsg: "密码长度不能小于6位",
    },
  ]);

  validator.add(registerForm.phoneNumber, [
    {
      strategy: "isMobile",
      errorMsg: "手机号码格式不正确",
    },
  ]);

  var errorMsg = validator.start();
  return errorMsg;
};

registerForm.onsubmit = function () {
  var errorMsg = validataFunc(); //获取校验结果
  if (errorMsg) {
    //如果有校验错误
    alert(errorMsg); //提示错误信息
    return false; //阻止表单提交
  }

  alert("校验通过，开始提交数据（模拟）");
  return false; // 关键：校验通过后，也要阻止表单默认提交，否则会报 405
};
