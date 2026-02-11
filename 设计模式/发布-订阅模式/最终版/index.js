var Event=(function(){
    var global=this,           //保存全局上下文（window）
        Event,                 //声明Event变量，稍后赋值
        _default='default';    //默认的命名空间名称

    Event=function(){          //开始定义Event的核心逻辑
        var _listen,           //私有变量：订阅函数的具体实现
            _trigger,          //私有变量：发布函数的具体实现
            _remove,           //私有变量：移除函数的具体实现
            _slice=Array.prototype.slice,           //缓存数组切片方法（用于转换arguments）
            _shift=Array.prototype.shift,           //缓存数组头部删除方法
            _unshift=Array.prototype.unshift,       //缓存数组头部添加方法
            namespaceCache={},      //命名空间缓存对象，用于存储不同命名空间的事件实例
            _create,                //私有变量：创建命名空间的函数
            find,                   //声明了但没用到的变量

            //内部工具函数：遍历数组并执行回调
            each=function(ary,fn){
                var ret;
                for(var i=0,l=ary.length;i<l;i++){
                     var n=ary[i];
                     //执行回调，并将this指向当前元素n
                     ret=fn.call(n,i,n);
                } 
                return ret;
            };

            //底层订阅实现
            _listen=function(key,fn,cache){
                //如果该事件key还没有对应的数组，创建一个空数组
                if(!cache[key]){
                    cache[key]=[];
                }
                //将回调函数推入数组
                cache[key].push(fn);
            };

            //底层移除实现
            _remove=function(key,cache,fn){
                if(cache[key]){
                    if(fn){
                        //如果指定了具体要移除哪个函数，则反向遍历删除
                        for(var i=cache[key].length-1;i>=0;i--){
                             if(cache[key][i]===fn){
                                  cache[key].splice(i,1);
                             }
                        }
                    }else{
                        //如果没指定函数，直接清空该key下所有的事件
                        cache[key]=[];
                    }
                }
            };

            //底层发布实现
            _trigger=function(){
                //arguments是一个类数组
                //假定arguments的第一个参数是cache，第二个是key

                //取出第一个参数：事件缓存对象（cache）
                var cache=_shift.call(arguments),
                     //取出第二个参数（现在的第一个）：事件名（key）
                     key=_shift.call(arguments),
                     //剩下的参数：传给回调函数的数据
                     args=arguments;
                     _self=this,
                     ret,
                     //从cache中找到对应的监听器数组
                     stack=cache[key];

                //如果没监听器，直接返回
                if(!stack||!stack.length){
                    return;
                }

                //遍历监听器数组，逐个执行
                return each(stack,function(){
                    //这里的this指向stack中的每一个fn
                    return this.apply(_self,args);
                });
            }

            //创建带有“离线事件”功能的命名空间
            _create=function(namespace){
                var namespace=namespace||_default;
                var cache={},             //当前命名空间的事件存储箱
                    offlineStack=[],      //离线事件栈（暂存还没被消费的消息）
                    //ret是当前命名空间对外暴露的对象
                    ret={
                        //对外暴露的listen
                        listen:function(key,fn,last){
                             //1.先正常订阅事件
                             _listen(key,fn,cache);
                             //2.检查离线栈（offlineStack）状态
                             //如果是null，说明已经初始化过了，无需处理离线消息
                             if(offlineStack===null){
                                  return;
                             }

                             //3.处理离线消息
                             if(last==='last'){
                                //如果指定了'last'，只执行离线栈里的最后一条
                                offlineStack.length&&offlineStack.pop()();
                             }else{
                                //否则，把离线栈里积压的消息全部执行一遍
                                each(offlineStack,function(){
                                     this();      //执行封装好的触发函数
                                });
                             }

                             //4.关键：置空离线栈
                             //只要被listen过一次，offlineStack就变成null
                             //以后再trigger就会直接执行，不再存入栈中
                             offlineStack=null;
                        },

                        //绑定一次
                        one:function(key,fn,last){
                            _remove(key,cache);    //先移除旧的
                            this.listen(key,fn,last);     //再绑定新的
                        },

                        remove:function(key,fn){
                            _remove(key,cache,fn);
                        },

                        //对外暴露的trigger
                        trigger:function(){
                            var fn,
                                args,
                                _self=this;

                            //技巧：把cache对象插到arguments的最前面
                            //这样传给底层的_trigger时，第一个参数就是cache
                            _unshift.call(arguments,cache);
                            args=arguments;

                            //封装一个执行函数
                            fn=function(){
                                return _trigger.apply(_self,args);
                            };

                            //判断当前状态
                            //如果offlineStack还存在（说明还没有人listen过），则不执行，而是把这个动作存起来
                            if(offlineStack){
                                return offlineStack.push(fn);
                            }
                            //如果offlineStack没了（说明已经有人listen了），直接执行
                            return fn();
                        }
                    };

                    //命名空间缓存逻辑
                    //如果该命名空间已经存在，直接返回缓存的对象，否则创建新对象并缓存
                    return namespace?(namespaceCache[namespace]?namespaceCache[namespace]:namespaceCache[namespace]=ret):ret;
            };

            //这里的return是Event内部IIFE的返回值
            //也就是我们外部拿到的Event对象
            return {
                create:_create,     //暴露创建命名空间的方法

                //下面这些都是默认命名空间（default）的简写方法
                //它们内部都调用了this.create()，即获取default命名空间对象
                one:function(key,fn,last){
                    var event=this.create();
                    event.one(key,fn,last);
                },

                remove:function(key,fn){
                    var event=this.create();
                    event.remove(key,fn);
                },

                listen:function(key,fn,last){
                    var event=this.create();
                    event.listen(key,fn,last);
                },

                trigger:function(){
                    var event=this.create();
                    event.trigger.apply(event,arguments);
                }
            };
    }();    //内部函数立即执行

    return Event;    //返回给最外层的var Event
})();     //外部函数立即执行