import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/Home.vue"),
      meta: {
        title: "首页",
      },
    },
    {
      path: "/tools",
      name: "tools",
      component: () => import("../views/Signature/index.vue"),
      meta: {
        title: "个性签名",
      },
    },
    {
      path: "/encrypt",
      name: "encrypt",
      component: () => import("../views/Encrypt/index.vue"),
      meta: {
        title: "加解密",
      },
    },
    {
      path: "/image-compression",
      name: "imageCompression",
      component: () => import("../views/ImageCompression/index.vue"),
      meta: {
        title: "图片压缩",
      },
    },
    {
      path: "/json-tools",
      name: "jsonTools",
      component: () => import("../views/JsonTools/index.vue"),
      meta: {
        title: "JSON工具",
      },
    },
    {
      path: "/pad",
      name: "pad",
      component: () => import("../views/Pad/index.vue"),
      meta: {
        title: "便签",
      },
    },
  ],
});

export default router;
