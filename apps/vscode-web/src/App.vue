<script setup lang="ts">
import BaseButton from '@typewords/ui/components/BaseButton.vue'
import Checkbox from '@ui/components/baase/checkbox/Checkbox.vue'
import Radio from '@ui/components/baase/radio/Radio.vue'
import Toast from '@ui/components/baase/toast/Toast.ts'

onMounted(()=>{
  Toast.error('123')
})
</script>

<template>
  <div>
    <Radio class="vue"></Radio>
    <Checkbox>123</Checkbox>
    <BaseButton>123</BaseButton>
    <router-view></router-view>
  </div>
</template>
