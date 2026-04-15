<template>
    <div>
        <p>子组件1</p>
        <p>当前计数: {{ count }}</p>
        <p>当前用户: {{ user.name }} {{ user.age }}</p>
    </div>
</template>

<script setup>
import {ref,reactive} from 'vue';

const count=ref(0);
const user=reactive({
  name:'张三',
  age:18
});

defineExpose({count,user});
</script>
