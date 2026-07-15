<template>
  <el-container class="container">
    <Header />
    <el-main class="app-main">
        <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import Header from "@/components/Header/index.vue";
</script>

<style scoped lang="less">
.container {
  min-height: 100vh;
  flex-direction: column;
}
</style>
