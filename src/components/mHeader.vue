<template>
  <div class="mHeader">
    <el-menu
      :default-active="activeIndex"
      router
      mode="horizontal"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
    >
      <el-menu-item index="list">列表页</el-menu-item>
      <!-- <el-menu-item index="/">下载页</el-menu-item> -->
      <el-menu-item index="form">表单页</el-menu-item>
    </el-menu>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter,useRoute } from 'vue-router'

let router = useRouter()
let route = useRoute()
let activeIndex = ref('/')

function initMenuActiveIndex(route){
  let routeName = route.name
  console.log('routeName:',routeName)
  activeIndex.value = routeName ? routeName.toLowerCase() : 'index'

}

router.beforeEach((to,from)=>{
  // console.log('to:',to)
  // console.log('from:',from)
  initMenuActiveIndex(to)
})


  
</script>
<style>
</style>