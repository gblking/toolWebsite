<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCounterStore } from '../stores/counter'
import http from '../utils/http'
import { toMd5, toSha256 } from '../utils/crypto'

const counterStore = useCounterStore()
const message = ref('toolWebsite')

const digests = computed(() => ({
  md5: toMd5(message.value),
  sha256: toSha256(message.value),
}))
</script>

<template>
  <section class="page-grid">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Project Stack</span>
          <el-tag type="success">Configured</el-tag>
        </div>
      </template>

      <div class="stack-list">
        <el-tag>Vue 3</el-tag>
        <el-tag>Pinia</el-tag>
        <el-tag>Vue Router</el-tag>
        <el-tag>Element Plus</el-tag>
        <el-tag>Axios</el-tag>
        <el-tag>CryptoJS</el-tag>
        <el-tag>Less</el-tag>
      </div>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Pinia State</span>
          <el-tag type="warning">Store</el-tag>
        </div>
      </template>

      <div class="pinia-panel">
        <div>
          <strong>{{ counterStore.count }}</strong>
          <p>Shared counter from `src/stores/counter.ts`.</p>
        </div>
        <div class="actions">
          <el-button type="primary" @click="counterStore.increment()">Increment</el-button>
          <el-button plain @click="counterStore.reset()">Reset</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="wide-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Axios + CryptoJS</span>
          <el-tag>Utilities</el-tag>
        </div>
      </template>

      <el-form label-position="top">
        <el-form-item label="Text to hash">
          <el-input v-model="message" placeholder="Enter any text" />
        </el-form-item>
      </el-form>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="Axios baseURL">{{ http.defaults.baseURL }}</el-descriptions-item>
        <el-descriptions-item label="Axios timeout">{{ http.defaults.timeout }} ms</el-descriptions-item>
        <el-descriptions-item label="MD5">{{ digests.md5 }}</el-descriptions-item>
        <el-descriptions-item label="SHA256">{{ digests.sha256 }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </section>
</template>

<style scoped lang="less">
.page-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.wide-card {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stack-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pinia-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.pinia-panel strong {
  display: block;
  font-size: 40px;
  line-height: 1;
}

.pinia-panel p {
  margin: 8px 0 0;
  color: #526581;
}

.actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .page-grid {
    grid-template-columns: 1fr;
  }

  .wide-card {
    grid-column: auto;
  }

  .pinia-panel {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
