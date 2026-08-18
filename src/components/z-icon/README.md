# z-icon

基于 [lucide-vue-next](https://lucide.dev/guide/packages/lucide-vue-next) 的统一图标组件：统一描边宽度（1.5px，匹配设计系统细线图标风格）、尺寸与颜色默认值，其余属性（class、style、aria-*、title 等）通过 `$attrs` 透传到 svg。

## 使用

```vue
<script setup lang="ts">
import { Image, ArrowRight } from "lucide-vue-next";
import ZIcon from "@/components/z-icon/index.vue";
</script>

<template>
  <!-- 基本用法：颜色跟随文字 -->
  <button class="text-charcoal">
    <z-icon :icon="Image" :size="16" />
    上传图片
  </button>

  <!-- 指定颜色与描边 -->
  <z-icon :icon="ArrowRight" :size="14" color="#5f5f5d" />

  <!-- 透传属性：title / class 等 -->
  <z-icon :icon="Image" :size="16" class="mr-1" title="图片" />
</template>
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `icon` | `LucideIcon` | — | lucide 图标组件（必填），从 `lucide-vue-next` 具名导入 |
| `size` | `number` | `20` | 图标尺寸（px） |
| `strokeWidth` | `number \| string` | `1.5` | 描边宽度，设计系统默认细线 |
| `absoluteStrokeWidth` | `boolean` | `false` | 描边宽度随 `size` 等比缩放（`stroke-width × 24 / size`） |
| `color` | `string` | `currentColor` | 图标颜色，默认继承文字颜色 |

## 注意事项

- **必须传 `icon` 组件而非图标名**：组件内部不做动态名称查找，图标在使用方显式 `import` 后传入，保证 Vite 能 tree-shaking，避免全量引入约 2MB 的图标库。
- 无子节点且无 a11y 属性时，lucide 自动添加 `aria-hidden="true"`；需要被读屏器读取时传 `aria-label` 或 `title`。
- 渐变按钮上的图标：组件颜色默认 `currentColor`，按钮用 `text-parchment` 等文字色类即可驱动图标颜色。
