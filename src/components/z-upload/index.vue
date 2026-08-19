<template>
  <div
    class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card-lg border-2 border-dashed border-linen-border bg-warm-sand py-12 text-center transition-colors hover:border-stone"
    role="button"
    tabindex="0"
    :class="{
      'border-indigo-accent': isDragOver,
      'pointer-events-none cursor-not-allowed opacity-60': disabled,
    }"
    :aria-label="title"
    @click="triggerFileInput"
    @keydown.enter="triggerFileInput"
    @keydown.space.prevent="triggerFileInput"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop.prevent="onDrop"
  >
    <z-icon
      :icon="icon ?? CloudUpload"
      :size="iconSize"
      class="text-dim-gray"
      aria-hidden="true"
    />
    <div>
      <p class="text-[15px] font-medium text-charcoal">{{ title }}</p>
      <p v-if="subtitle" class="mt-0.5 text-caption text-dim-gray">{{ subtitle }}</p>
    </div>
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="onFileChange"
    />
  </div>
  <p
    v-if="rejectText"
    class="mt-3 flex items-start gap-1.5 text-caption text-indigo-accent"
  >
    <z-icon :icon="TriangleAlert" :size="14" class="mt-0.5 shrink-0" aria-hidden="true" />
    <span>{{ rejectText }}</span>
  </p>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { CloudUpload, TriangleAlert } from "lucide-vue-next";
import type { LucideIcon } from "lucide-vue-next";
import ZIcon from "@/components/z-icon/index.vue";

interface Props {
  /** 上传区标题 */
  title?: string
  /** 副标题说明 */
  subtitle?: string
  /** input accept 属性，同时用于拖拽文件过滤；支持 ".jpg,image/*,video/mp4" 等写法，留空不限制 */
  accept?: string
  /** 是否支持多选 */
  multiple?: boolean
  /** 上传区图标，默认 CloudUpload */
  icon?: LucideIcon
  /** 图标尺寸（px） */
  iconSize?: number
  /** 是否禁用上传（点击与拖拽均失效） */
  disabled?: boolean
  /** 单文件大小上限（MB），超限文件自动跳过并提示 */
  maxSizeMB?: number
}

// 注意：icon 不能放在 withDefaults 里作为默认值——
// lucide-vue-next 图标是函数式组件（函数），Vue 3.5 会把函数类型的 prop 默认值
// 当作 default factory 调用，执行时 slots 为 undefined 直接崩溃；
// 因此改用模板中 `icon ?? CloudUpload` 兜底（显式传值不受影响）。
const props = withDefaults(defineProps<Props>(), {
  title: "点击或拖拽文件到此处上传",
  subtitle: "",
  accept: "",
  multiple: true,
  iconSize: 28,
  disabled: false,
  maxSizeMB: undefined,
});

const emit = defineEmits<{
  /** 已通过 accept 与大小过滤的合法文件列表 */
  select: [files: File[]]
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const rejectText = ref("");

function triggerFileInput() {
  if (props.disabled) return;
  fileInputRef.value?.click();
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;
  handleFiles([...target.files]);
  target.value = ""; // 允许重复选择同一文件
}

function onDrop(e: DragEvent) {
  isDragOver.value = false;
  if (props.disabled || !e.dataTransfer) return;
  handleFiles([...e.dataTransfer.files]);
}

/** 按 accept 规则匹配文件：".jpg" 匹配扩展名、"image/*" 匹配 MIME 前缀、其余精确匹配 MIME */
function matchAccept(file: File): boolean {
  const accept = props.accept.trim().toLowerCase();
  if (!accept || accept === "*" || accept === "*/*") return true;
  return accept.split(",").some((rule) => {
    const r = rule.trim();
    if (!r) return false;
    if (r.startsWith(".")) return file.name.toLowerCase().endsWith(r);
    if (r.endsWith("/*")) return file.type.toLowerCase().startsWith(r.slice(0, -1));
    return file.type.toLowerCase() === r;
  });
}

function handleFiles(files: File[]) {
  const skipped: string[] = [];
  const valid: File[] = [];
  for (const file of files) {
    if (!matchAccept(file)) {
      skipped.push(file.name);
      continue;
    }
    if (props.maxSizeMB && file.size > props.maxSizeMB * 1024 * 1024) {
      skipped.push(file.name);
      continue;
    }
    valid.push(file);
  }
  if (skipped.length) {
    const sizeTip = props.maxSizeMB ? `或超过${props.maxSizeMB}MB` : "";
    rejectText.value = `已跳过不支持${sizeTip}的文件：${skipped.join("、")}`;
  }
  if (valid.length) emit("select", valid);
}
</script>
