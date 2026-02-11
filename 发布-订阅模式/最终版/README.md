## 发布订阅模式最终版
离线栈（Offline Stack）逻辑：

   1.状态标志：offlineStack 变量既是存储容器，也是状态标志。

   2.未监听状态：offlineStack 是一个数组 []。此时 trigger 只是把任务 push 进去，不执行。

   3.已监听状态：offlineStack 被设为 null。此时 trigger 会直接执行。

   4.状态切换点：第一次调用 listen 时，会把数组里的任务清空执行，然后将变量设为 null。