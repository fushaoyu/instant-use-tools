import { createWebHashHistory, createRouter } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/images-zoom",
  },
  {
    path: "/images-icon",
    name: "图片转图标",
    component: () => import("@/views/images-icon/index.vue"),
  },
  {
    path: "/images-zoom",
    name: "图片调整大小",
    component: () => import("@/views/images-zoom/index.vue"),
  },
  {
    path: "/images-base64",
    name: "图片Base64转换",
    component: () => import("@/views/images-base64/index.vue"),
  },
  {
    path: "/images-split",
    name: "图片分割",
    component: () => import("@/views/images-split/index.vue"),
  },
  {
    path: "/images-compress",
    name: "图片压缩",
    component: () => import("@/views/images-compress/index.vue"),
  },
  {
    path: "/videos-watermark",
    name: "视频水印",
    component: () => import("@/views/videos-watermark/index.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});
export default router;
