<script setup lang="ts">
import { ref } from "vue";
import MyInput from "./components/MyInput.vue";

const username = ref("");
</script>

<template>
  <MyInput v-model="username" />
  <p>当前输入值: {{ username }}</p>
</template>

<style scoped></style>
