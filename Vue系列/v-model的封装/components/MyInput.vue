<template>
  <input
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
const props = defineProps({ modelValue: String });
const emit = defineEmits(["update:modelValue"]);
</script>

<style lang="css"></style>
