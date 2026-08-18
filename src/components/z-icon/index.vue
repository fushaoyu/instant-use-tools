<template>
  <component
    :is="icon"
    :size="size"
    :stroke-width="strokeWidth"
    :absolute-stroke-width="absoluteStrokeWidth"
    :color="color"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import type { LucideIcon } from "lucide-vue-next";

interface Props {
  /** lucide 图标组件（使用方显式 import 后传入，保证 tree-shaking） */
  icon: LucideIcon
  /** 图标尺寸（px） */
  size?: number
  /** 描边宽度，默认 1.5 对应设计系统细线图标 */
  strokeWidth?: number | string
  /** 描边宽度随 size 等比缩放（lucide 特性，用于大小不一的图标保持视觉一致） */
  absoluteStrokeWidth?: boolean
  /** 图标颜色，默认 currentColor 跟随文字颜色 */
  color?: string
}

withDefaults(defineProps<Props>(), {
  size: 20,
  strokeWidth: 1.5,
  absoluteStrokeWidth: false,
  color: "currentColor",
});
</script>
