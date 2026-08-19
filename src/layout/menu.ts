import type { LucideIcon } from "lucide-vue-next";
import { Clapperboard, FileImage } from "lucide-vue-next";

/** 子菜单项（纯文字，无图标，保持层级安静） */
export interface MenuChild {
  /** 菜单显示名 */
  name: string;
  /** 路由 path（与 router/index.ts 对应） */
  path: string;
}

export interface MenuItem {
  /** 菜单显示名 */
  name: string;
  /** lucide 图标组件（具名导入，保持 tree-shaking） */
  icon: LucideIcon;
  /** 路由 path（与 router/index.ts 对应） */
  path: string;
  /** 子菜单项（可选，有 children 时渲染为下拉菜单） */
  children?: MenuChild[];
}

/** 顶部导航菜单配置：图片工具 / 视频工具 两组，子工具挂在其下 */
export const menus: MenuItem[] = [
  {
    name: "图片工具",
    icon: FileImage,
    path: "/images-view",
    children: [
      { name: "图片调整大小", path: "/images-zoom" },
      { name: "图片分割", path: "/images-split" },
      { name: "图片压缩", path: "/images-compress" },
      { name: "图片转图标", path: "/images-icon" },
      { name: "图片加水印", path: "/images-watermark" },
      { name: "图片Base64转换", path: "/images-base64" },
    ],
  },
  {
    name: "视频工具",
    icon: Clapperboard,
    path: "/videos-view",
    children: [{ name: "视频水印", path: "/videos-watermark" }],
  },
];
