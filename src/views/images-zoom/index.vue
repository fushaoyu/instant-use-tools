<template>
  <div class="mx-auto max-w-3xl px-6 py-12">
    <!-- 页头 -->
    <header class="mb-8 flex items-start gap-4">
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-charcoal text-parchment"
      >
        <z-icon :icon="Scaling" :size="20" aria-hidden="true" />
      </span>
      <div>
        <h2 class="text-heading-sm font-semibold text-charcoal">
          批量无损图片尺寸修改器
        </h2>
        <p class="mt-1 text-caption text-dim-gray">
          本地 H5 处理，图片不会上传到任何服务器
        </p>
      </div>
    </header>

    <!-- 上传区 -->
    <div
      class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card-lg border-2 border-dashed border-linen-border bg-warm-sand py-12 text-center transition-colors hover:border-stone"
      :class="{ 'border-indigo-accent': isDragOver }"
      @click="triggerFileInput"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <z-icon :icon="CloudUpload" :size="26" class="text-dim-gray" aria-hidden="true" />
      <div>
        <p class="text-[15px] font-medium text-charcoal">
          点击或拖拽图片到此处上传
        </p>
        <p class="mt-0.5 text-caption text-dim-gray">支持多选，PNG / JPG / WebP</p>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="onFileSelect"
      />
    </div>

    <p class="mt-3 text-[15px] text-charcoal">
      已上传图片：<span class="font-semibold">{{ originFiles.length }}</span> 张
    </p>

    <!-- 设置面板 -->
    <section
      class="mt-6 rounded-card-lg border border-linen-border bg-parchment p-6 shadow-subtle-2 sm:p-7"
    >
      <div class="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 sm:items-end">
        <label class="block">
          <span class="mb-1.5 block text-caption font-medium text-charcoal"
            >目标宽度（px）</span
          >
          <input
            v-model.number="targetW"
            type="number"
            placeholder="宽度"
            class="h-10 w-full rounded-input border border-linen-border bg-parchment px-3 text-[15px] text-charcoal placeholder:text-dim-gray/70 focus:border-indigo-accent focus:outline-none"
          />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-caption font-medium text-charcoal"
            >目标高度（px）</span
          >
          <input
            v-model.number="targetH"
            type="number"
            placeholder="高度"
            class="h-10 w-full rounded-input border border-linen-border bg-parchment px-3 text-[15px] text-charcoal placeholder:text-dim-gray/70 focus:border-indigo-accent focus:outline-none"
          />
        </label>
        <label
          class="flex h-10 cursor-pointer items-center gap-2 self-end text-[15px] text-charcoal sm:col-span-2"
        >
          <input
            v-model="lockRatio"
            type="checkbox"
            class="h-4 w-4 cursor-pointer accent-indigo-accent"
          />
          锁定等比例缩放
        </label>
      </div>

      <div class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label class="flex items-center gap-2 text-[15px] text-charcoal">
          输出格式
          <select
            v-model="outputType"
            class="h-10 cursor-pointer rounded-input border border-linen-border bg-parchment px-3 text-[15px] text-charcoal focus:border-indigo-accent focus:outline-none"
          >
            <option value="image/png">PNG（无损）</option>
            <option value="image/jpeg">JPG（有损）</option>
            <option value="image/webp">WebP</option>
          </select>
        </label>
        <label class="flex items-center gap-2 text-[15px] text-charcoal">
          画质 <span class="font-semibold">{{ quality }}%</span>
          <input
            v-model.number="quality"
            type="range"
            min="50"
            max="100"
            class="w-36 cursor-pointer accent-indigo-accent"
          />
        </label>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <button
          class="flex h-11 cursor-pointer items-center gap-2 rounded-pill bg-charcoal px-6 text-[15px] font-medium text-parchment hover:bg-ink disabled:cursor-not-allowed disabled:bg-stone disabled:text-dim-gray"
          :disabled="processing || !originFiles.length"
          @click="handleProcess"
        >
          <z-icon
            v-if="processing"
            :icon="LoaderCircle"
            :size="16"
            class="animate-spin"
            aria-hidden="true"
          />
          {{ processing ? "处理中…" : "批量处理图片" }}
        </button>
        <button
          class="flex h-11 cursor-pointer items-center gap-2 rounded-pill border border-linen-border bg-parchment px-6 text-[15px] font-medium text-charcoal hover:border-stone hover:bg-warm-sand disabled:cursor-not-allowed disabled:text-stone"
          :disabled="!processedBlobs.length"
          @click="downloadZip"
        >
          <z-icon :icon="Archive" :size="16" aria-hidden="true" />
          打包全部下载 ZIP
        </button>
      </div>

      <p class="mt-4 flex items-center gap-1.5 text-caption text-indigo-accent">
        <z-icon :icon="TriangleAlert" :size="14" class="shrink-0" aria-hidden="true" />
        所有图片在浏览器本地运算，不会上传到任何服务器；PNG 格式忽略画质参数
      </p>
    </section>

    <!-- 原图预览 -->
    <section class="mt-8">
      <h3 class="text-subheading font-medium text-charcoal">原图预览</h3>
      <div
        class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3"
      >
        <div
          v-for="(item, idx) in originPreviewList"
          :key="idx"
          class="rounded-card border border-linen-border bg-parchment p-2 shadow-subtle"
        >
          <img
            :src="item.url"
            alt=""
            class="h-32 w-full rounded-img bg-warm-sand object-contain"
          />
          <div class="mt-1.5 break-all text-caption text-dim-gray">
            {{ item.name }}
          </div>
        </div>
      </div>
    </section>

    <!-- 处理结果预览 -->
    <section class="mt-8">
      <h3 class="text-subheading font-medium text-charcoal">处理结果预览</h3>
      <div
        class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3"
      >
        <div
          v-for="(item, idx) in resultPreviewList"
          :key="idx"
          class="rounded-card border border-linen-border bg-parchment p-2 shadow-subtle"
        >
          <img
            :src="item.url"
            alt=""
            class="h-32 w-full rounded-img bg-warm-sand object-contain"
          />
          <div class="mt-1.5 break-all text-caption text-dim-gray">
            {{ item.name }}
          </div>
          <button
            class="mt-2 h-8 w-full cursor-pointer rounded-pill border border-linen-border text-caption font-medium text-charcoal hover:border-stone hover:bg-warm-sand"
            @click="saveSingle(idx)"
          >
            单张下载
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { Archive, CloudUpload, LoaderCircle, Scaling, TriangleAlert } from "lucide-vue-next";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import ZIcon from "@/components/z-icon/index.vue";

const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

const targetW = ref<number | null>(null);
const targetH = ref<number | null>(null);
const lockRatio = ref(true);
const outputType = ref<"image/png" | "image/jpeg" | "image/webp">("image/png");
const quality = ref(95);

const originFiles = ref<File[]>([]);
const processedBlobs = ref<Blob[]>([]);
const processedNames = ref<string[]>([]);
const processing = ref(false);

interface PreviewItem {
  url: string;
  name: string;
}
const originPreviewList = computed<PreviewItem[]>(() =>
  originFiles.value.map((file) => ({
    url: URL.createObjectURL(file),
    name: file.name,
  })),
);

const resultPreviewList = computed<PreviewItem[]>(() =>
  processedBlobs.value.map((blob, i) => ({
    url: URL.createObjectURL(blob),
    name: processedNames.value[i],
  })),
);

// 组件销毁，释放所有预览URL，防止内存泄漏
onUnmounted(() => {
  originPreviewList.value.forEach((item) => URL.revokeObjectURL(item.url));
  resultPreviewList.value.forEach((item) => URL.revokeObjectURL(item.url));
});

function triggerFileInput() {
  fileInputRef.value?.click();
}
function onDragOver() {
  isDragOver.value = true;
}
function onDragLeave() {
  isDragOver.value = false;
}
function onDrop(e: DragEvent) {
  isDragOver.value = false;
  const files = [...e.dataTransfer!.files].filter((f) =>
    f.type.startsWith("image/"),
  );
  addFiles(files);
}
function onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;
  addFiles([...target.files]);
}
function addFiles(files: File[]) {
  originFiles.value.push(...files);
}

/** 图片缩放 */
function resizeImage(
  file: File,
  w: number,
  h: number,
  keepRatio: boolean,
  mimeType: string,
  q: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      let dw = w;
      let dh = h;
      if (keepRatio) {
        const scale = Math.min(w / img.width, h / img.height);
        dw = Math.round(img.width * scale);
        dh = Math.round(img.height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = dw;
      canvas.height = dh;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, dw, dh);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          resolve(blob);
        },
        mimeType,
        q / 100,
      );
    };
  });
}

/** 批量处理 */
async function handleProcess() {
  const w = targetW.value;
  const h = targetH.value;
  if (!w || !h) {
    alert("请填写目标宽度与高度像素");
    return;
  }
  if (originFiles.value.length === 0) {
    alert("请先上传图片！");
    return;
  }

  processing.value = true;
  processedBlobs.value = [];
  processedNames.value = [];

  try {
    for (const file of originFiles.value) {
      const blob = await resizeImage(
        file,
        w,
        h,
        lockRatio.value,
        outputType.value,
        quality.value,
      );
      if (!blob) continue;
      processedBlobs.value.push(blob);

      let fileName = file.name;
      if (outputType.value === "image/jpeg") {
        fileName = fileName.replace(/\.\w+$/, ".jpg");
      } else if (outputType.value === "image/webp") {
        fileName = fileName.replace(/\.\w+$/, ".webp");
      } else {
        fileName = fileName.replace(/\.\w+$/, ".png");
      }
      processedNames.value.push(fileName);
    }
    alert(`处理完成，共${processedBlobs.value.length}张图片`);
  } finally {
    processing.value = false;
  }
}

/** 单张下载 */
function saveSingle(index: number) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(processedBlobs.value[index]);
  a.download = processedNames.value[index];
  a.click();
}

/** ZIP打包 */
async function downloadZip() {
  const zip = new JSZip();
  processedBlobs.value.forEach((blob, i) => {
    zip.file(processedNames.value[i], blob);
  });
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "缩放图片合集.zip");
}
</script>
