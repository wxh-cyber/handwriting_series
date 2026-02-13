## 发布订阅模式最终版
### 离线栈（Offline Stack）逻辑：

   1.状态标志：offlineStack 变量既是存储容器，也是状态标志。

   2.未监听状态：offlineStack 是一个数组 []。此时 trigger 只是把任务 push 进去，不执行。

   3.已监听状态：offlineStack 被设为 null。此时 trigger 会直接执行。

   4.状态切换点：第一次调用 listen 时，会把数组里的任务清空执行，然后将变量设为 null。

### 触发事件逻辑分析

#### 1.命名空间为默认命名空间时的触发逻辑
```javascript
//引入Event模块
import Event from './index.js';

//默认命名空间触发login事件
Event.create().trigger('login',{name:'John'});
//等价于Event.create('default').trigger('login',{name:'John'});
//等价于Event.trigger('login',{name:'John'})
```
   在Event模块中调用create函数，如果默认为空，会返回默认命名空间的实例，等价于传入default参数，或者不调用create，直接调用trigger方法，这是因为在向外暴露的trigger方法中，已经封装了调用create()的逻辑，所以以上方法都是创建了默认命名空间。

#### 2.命名空间为非默认命名空间时的触发逻辑
```javascript
//引入Event模块
import Event from './index.js';

//在user命名空间中触发login事件
Event.create('user').trigger('login',{name:'John'});
```
   在Event模块中调用create函数，传入user参数，会返回user命名空间的实例。