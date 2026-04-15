<template>
    <div>
        <p>子组件2</p>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const inputRef=ref(null);
const formData=ref({});

const focus=() => inputRef.value.focus();
const validate=() => {
    return true;
}
const reset=()=>{
    formData.value={};
};

defineExpose({focus,validate,reset});
</script>
