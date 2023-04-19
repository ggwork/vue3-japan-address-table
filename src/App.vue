

<template>
  <div class="container">
    <mHeader></mHeader>
    <div class="mbody">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import mHeader from './components/mHeader.vue';



</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
