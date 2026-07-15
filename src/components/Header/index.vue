<template>
  <el-header class="header">
    <div class="brand">
      <img :src="logoImg" alt="" class="logo" />
    </div>

    <el-menu
      class="header-menu"
      mode="horizontal"
      :default-active="activeMenu"
      :ellipsis="false"
      router
    >
      <template v-for="item in menuRoutes" :key="item.path">
        <el-sub-menu v-if="item.children?.length" :index="item.path">
          <template #title>{{ getRouteTitle(item) }}</template>

          <el-menu-item
            v-for="child in item.children"
            :key="child.path"
            :index="resolveChildPath(item.path, child.path)"
          >
            {{ getRouteTitle(child) }}
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item v-else :index="item.path">
          {{ getRouteTitle(item) }}
        </el-menu-item>
      </template>
    </el-menu>
  </el-header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter, type RouteRecordRaw } from "vue-router";
import logoImg from "@/assets/images/logo.png";

const router = useRouter();
const route = useRoute();

const menuRoutes = computed(() =>
  router.options.routes.filter((item) => !item.meta?.hidden),
);

const activeMenu = computed(() => route.path);

const routeTitleMap: Record<string, string> = {
  home: "首页",
  decorators: "示例",
  tools: "个性签名",
  encrypt: "加解密",
  imageCompression: "图片压缩",
  jsonTools: "JSON工具",
  pad: "便签",
};

function resolveChildPath(parentPath: string, childPath: string) {
  if (childPath.startsWith("/")) {
    return childPath;
  }

  const normalizedParent = parentPath.endsWith("/")
    ? parentPath.slice(0, -1)
    : parentPath;

  return `${normalizedParent}/${childPath}`;
}

function getRouteTitle(item: RouteRecordRaw) {
  const routeName = typeof item.name === "string" ? item.name : "";

  return (
    routeTitleMap[routeName] ??
    String(item.meta?.title ?? routeName ?? item.path)
  );
}
</script>

<style scoped lang="less">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(20, 33, 61, 0.08);

  .brand {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .logo {
    height: 50px;
  }

  .header-menu {
    flex: 1;
    min-width: 0;
    justify-content: flex-end;
    background: transparent;
    border-bottom: none;
    --el-menu-bg-color: transparent;
    --el-menu-hover-bg-color: rgba(20, 33, 61, 0.04);
    --el-menu-active-color: #1d4ed8;
    --el-menu-horizontal-height: 56px;
  }
}
</style>
