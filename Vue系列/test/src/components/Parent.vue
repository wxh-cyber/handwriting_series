<template>
    <div>
        <p>父组件</p>
        <Child_1 ref="childRef"/>
        <!-- 
            注意：
                1.父组件通过ref获取子组件实例对象，必须在子组件中通过defineExpose暴露数据，否则父组件无法访问。
                2.父组件通过ref获取子组件实例对象，获取到的都是响应式数据，所以父组件修改子组件数据后，子组件会自动更新视图。
                3.注意：当子组件执行defineExpose({count,user})时，Vue内部会对暴露的对象做proxyRefs处理。
                  这意味着父组件通过childRef.value.count访问时，ref已经自动解包，拿到的是数值，而不是{value:0}的ref对象。
                  proxy的setter会将赋值操作透传回ref内部。
         -->
        <button @click="childRef.count++">点击count+1</button>
        <button @click="childRef.user.age++">点击age+1</button>
        <button @click="readData">读取子组件数据</button>
        <hr />
    </div>
</template>

<script setup>
import { ref } from 'vue';
import Child_1 from './Child_1.vue';
import Child_2 from './Child_2.vue';

const childRef=ref(null);

const readData=()=>{
    console.log(childRef.value.count);
    console.log(childRef.value.user);
}
</script>