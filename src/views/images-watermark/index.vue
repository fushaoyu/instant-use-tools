<template>
  <div class="mx-auto max-w-3xl px-6 py-12">
    <!-- 页面头部 -->
    <header class="mb-8 flex items-start gap-4">
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-charcoal text-parchment"
        aria-hidden="true"
      >
        <z-icon :icon="Stamp" :size="20" />
      </span>
      <div>
        <h1 class="text-heading-sm font-[480] text-charcoal">图片加水印</h1>
        <p class="mt-1 text-caption text-dim-gray">
          文字或图片水印、透明度、位置、角度与平铺可调；本地浏览器处理，不上传服务器
        </p>
      </div>
    </header>

    <!-- 原图上传 -->
    <z-upload
      accept="image/*"
      multiple
      :disabled="processing || isAddingFiles"
      title="点击或拖拽图片到此处上传"
      subtitle="支持多张图片，可实时预览，生成与下载均在本地完成"
      :max-size-m-b="MAX_FILE_MB"
      @select="addSourceFiles"
    />

    <!-- 原图列表 -->
    <section v-if="sourceList.length" class="mt-6">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h2 class="text-subheading font-[480] text-charcoal">
          已上传原图（{{ sourceList.length }}张）
        </h2>
        <button
          type="button"
          class="flex h-9 cursor-pointer items-center gap-1.5 rounded-pill border border-linen-border bg-parchment px-3.5 text-[13px] text-charcoal transition-colors hover:border-stone hover:bg-warm-sand disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="processing || isAddingFiles"
          @click="clearSourceFiles"
        >
          <z-icon :icon="Trash2" :size="14" />
          清空
        </button>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
        <article
          v-for="item in sourceList"
          :key="item.uid"
          class="rounded-card border border-linen-border bg-parchment p-3"
        >
          <img
            :src="item.objUrl"
            :alt="item.name"
            class="h-30 w-full rounded-img bg-warm-sand object-contain"
          />
          <p class="mt-2 break-all text-caption text-charcoal">{{ item.name }}</p>
          <p class="text-[12px] text-dim-gray">
            {{ item.width }}×{{ item.height }} · {{ formatFileSize(item.file.size) }}
          </p>
          <button
            type="button"
            class="mt-2 h-8 w-full cursor-pointer rounded-pill border border-linen-border bg-parchment text-[12px] text-dim-gray transition-colors hover:border-stone hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="processing || isAddingFiles"
            @click="removeSource(item)"
          >
            移除
          </button>
        </article>
      </div>
    </section>

    <!-- 水印设置 -->
    <section
      v-if="sourceList.length"
      class="mt-8 rounded-card-lg border border-linen-border bg-parchment p-6 shadow-subtle-2 sm:p-7"
    >
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h2 class="text-subheading font-[480] text-charcoal">水印设置</h2>
        <button
          type="button"
          class="flex h-9 cursor-pointer items-center gap-1.5 rounded-pill border border-linen-border bg-parchment px-3.5 text-[13px] text-charcoal transition-colors hover:border-stone hover:bg-warm-sand"
          @click="resetSettings"
        >
          <z-icon :icon="RotateCcw" :size="14" />
          恢复默认
        </button>
      </div>

      <!-- 水印类型 -->
      <div class="mt-5 flex flex-wrap gap-2">
        <button
          v-for="item in watermarkModeOptions"
          :key="item.value"
          type="button"
          class="cursor-pointer rounded-pill border px-3.5 py-2 text-[13px] transition-colors"
          :class="
            watermarkMode === item.value
              ? 'border-charcoal bg-charcoal font-medium text-parchment'
              : 'border-linen-border bg-parchment text-dim-gray hover:border-stone hover:text-charcoal'
          "
          @click="watermarkMode = item.value"
        >
          {{ item.label }}
        </button>
      </div>

      <!-- 文字水印设置 -->
      <div v-if="watermarkMode === 'text'" class="mt-5">
        <label class="block">
          <span class="mb-1.5 block text-caption font-medium text-charcoal">水印文字</span>
          <input
            v-model.trim="watermarkText"
            type="text"
            maxlength="80"
            placeholder="例如：仅供预览 · © 我的图片"
            class="h-10 w-full rounded-input border border-linen-border bg-parchment px-3 text-[15px] text-charcoal placeholder:text-dim-gray/70 focus:border-indigo-accent focus:outline-none"
          />
        </label>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-caption font-medium text-charcoal">
              文字大小：{{ fontSizePercent }}%
            </span>
            <input
              v-model.number="fontSizePercent"
              type="range"
              min="1"
              max="20"
              step="0.5"
              class="w-full cursor-pointer accent-indigo-accent"
            />
            <span class="mt-1 block text-[12px] text-dim-gray">
              按原图短边自动换算，适配不同分辨率
            </span>
          </label>
          <label class="block">
            <span class="mb-1.5 block text-caption font-medium text-charcoal">文字颜色</span>
            <input
              v-model="watermarkColor"
              type="color"
              class="h-10 w-full cursor-pointer rounded-input border border-linen-border bg-parchment px-2"
            />
          </label>
        </div>
      </div>

      <!-- 图片水印设置 -->
      <div v-else class="mt-5">
        <div class="flex flex-wrap items-center gap-4">
          <label
            class="flex h-10 cursor-pointer items-center rounded-pill border border-linen-border bg-parchment px-4 text-[13px] text-charcoal transition-colors hover:border-stone hover:bg-warm-sand"
          >
            <z-icon :icon="ImagePlus" :size="15" class="mr-1.5" />
            选择水印图片
            <input type="file" accept="image/*" class="hidden" @change="handleWatermarkFile" />
          </label>
          <button
            v-if="watermarkFile"
            type="button"
            class="flex h-10 cursor-pointer items-center rounded-pill border border-linen-border bg-parchment px-4 text-[13px] text-dim-gray transition-colors hover:border-stone hover:text-charcoal"
            @click="clearWatermarkImage"
          >
            移除水印图
          </button>
          <p v-if="watermarkFile" class="text-caption text-dim-gray">
            {{ watermarkFile.name }} · {{ formatFileSize(watermarkFile.size) }}
          </p>
        </div>

        <div
          v-if="watermarkUrl"
          class="mt-4 flex h-28 w-full items-center justify-center rounded-card border border-linen-border bg-warm-sand"
        >
          <img
            :src="watermarkUrl"
            alt="水印图片预览"
            class="max-h-24 max-w-[70%] object-contain"
          />
        </div>

        <label class="mt-4 block">
          <span class="mb-1.5 block text-caption font-medium text-charcoal">
            水印图片大小：{{ watermarkImageScale }}%
          </span>
          <input
            v-model.number="watermarkImageScale"
            type="range"
            min="2"
            max="80"
            step="1"
            class="w-full cursor-pointer accent-indigo-accent"
          />
          <span class="mt-1 block text-[12px] text-dim-gray">
            按原图短边缩放，保持水印图片宽高比
          </span>
        </label>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1.5 block text-caption font-medium text-charcoal">
            透明度：{{ watermarkOpacity }}%
          </span>
          <input
            v-model.number="watermarkOpacity"
            type="range"
            min="5"
            max="100"
            step="1"
            class="w-full cursor-pointer accent-indigo-accent"
          />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-caption font-medium text-charcoal">
            旋转角度：{{ watermarkRotation }}°
          </span>
          <input
            v-model.number="watermarkRotation"
            type="range"
            min="-180"
            max="180"
            step="1"
            class="w-full cursor-pointer accent-indigo-accent"
          />
        </label>
      </div>

      <!-- 排布方式 -->
      <div class="mt-6 flex flex-wrap gap-2">
        <button
          v-for="item in watermarkLayoutOptions"
          :key="item.value"
          type="button"
          class="cursor-pointer rounded-pill border px-3.5 py-2 text-[13px] transition-colors"
          :class="
            watermarkLayout === item.value
              ? 'border-charcoal bg-charcoal font-medium text-parchment'
              : 'border-linen-border bg-parchment text-dim-gray hover:border-stone hover:text-charcoal'
          "
          @click="watermarkLayout = item.value"
        >
          {{ item.label }}
        </button>
      </div>

      <!-- 单个水印位置 -->
      <div v-if="watermarkLayout === 'single'" class="mt-5">
        <span class="mb-2 block text-caption font-medium text-charcoal">水印位置</span>
        <div class="grid w-fit grid-cols-3 gap-2">
          <button
            v-for="position in positionOptions"
            :key="position.value"
            type="button"
            class="h-10 w-20 cursor-pointer rounded-input border text-[12px] transition-colors"
            :class="
              watermarkPosition === position.value
                ? 'border-charcoal bg-charcoal font-medium text-parchment'
                : 'border-linen-border bg-parchment text-dim-gray hover:border-stone hover:text-charcoal'
            "
            @click="watermarkPosition = position.value"
          >
            {{ position.label }}
          </button>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-caption font-medium text-charcoal">
              水平微调：{{ positionOffsetX }}%
            </span>
            <input
              v-model.number="positionOffsetX"
              type="range"
              min="-50"
              max="50"
              step="1"
              class="w-full cursor-pointer accent-indigo-accent"
            />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-caption font-medium text-charcoal">
              垂直微调：{{ positionOffsetY }}%
            </span>
            <input
              v-model.number="positionOffsetY"
              type="range"
              min="-50"
              max="50"
              step="1"
              class="w-full cursor-pointer accent-indigo-accent"
            />
          </label>
        </div>
      </div>

      <!-- 平铺水印间距 -->
      <div v-else class="mt-5">
        <label class="block">
          <span class="mb-1.5 block text-caption font-medium text-charcoal">
            平铺间距：{{ tileSpacingPercent }}%
          </span>
          <input
            v-model.number="tileSpacingPercent"
            type="range"
            min="0"
            max="150"
            step="5"
            class="w-full cursor-pointer accent-indigo-accent"
          />
          <span class="mt-1 block text-[12px] text-dim-gray">
            适合防盗图场景，可配合旋转角度形成斜向水印网
          </span>
        </label>
      </div>

      <label class="mt-4 block">
        <span class="mb-1.5 block text-caption font-medium text-charcoal">
          安全边距：{{ marginPercent }}%
        </span>
        <input
          v-model.number="marginPercent"
          type="range"
          min="0"
          max="20"
          step="0.5"
          class="w-full cursor-pointer accent-indigo-accent"
        />
      </label>

      <!-- 输出设置 -->
      <div class="mt-6 border-t border-linen-border pt-5">
        <span class="mb-2 block text-caption font-medium text-charcoal">输出格式</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in outputFormatOptions"
            :key="item.value"
            type="button"
            class="cursor-pointer rounded-pill border px-3.5 py-2 text-[13px] transition-colors"
            :class="
              outputFormat === item.value
                ? 'border-charcoal bg-charcoal font-medium text-parchment'
                : 'border-linen-border bg-parchment text-dim-gray hover:border-stone hover:text-charcoal'
            "
            @click="outputFormat = item.value"
          >
            {{ item.label }}
          </button>
        </div>

        <label v-if="outputFormat === 'jpeg' || outputFormat === 'webp'" class="mt-4 block">
          <span class="mb-1.5 block text-caption font-medium text-charcoal">
            输出质量：{{ outputQuality }}%
          </span>
          <input
            v-model.number="outputQuality"
            type="range"
            min="50"
            max="100"
            step="1"
            class="w-full cursor-pointer accent-indigo-accent"
          />
        </label>
      </div>

      <!-- 实时预览 -->
      <div class="mt-7 rounded-card border border-linen-border bg-warm-sand p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h3 class="text-caption font-medium text-charcoal">实时预览（第一张图）</h3>
          <span v-if="isAddingFiles" class="text-[12px] text-dim-gray">图片读取中…</span>
        </div>
        <div class="flex max-h-[520px] items-center justify-center overflow-hidden rounded-img bg-parchment">
          <canvas ref="previewCanvasRef" class="max-h-[480px] max-w-full object-contain" />
        </div>
        <p v-if="previewError" class="mt-3 text-caption text-indigo-accent">
          {{ previewError }}
        </p>
      </div>

      <!-- 操作区 -->
      <div class="mt-7 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="flex h-11 cursor-pointer items-center gap-2 rounded-pill bg-charcoal px-6 text-[15px] font-medium text-parchment transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="processing || !canProcess"
          @click="applyWatermarks"
        >
          <z-icon :icon="WandSparkles" :size="17" />
          {{ processing ? "处理中…" : "一键添加水印" }}
        </button>
        <span v-if="statusText" class="text-caption text-dim-gray">{{ statusText }}</span>
      </div>

      <div
        v-if="warningText"
        class="mt-3 flex items-start gap-1.5 text-caption text-indigo-accent"
      >
        <z-icon :icon="TriangleAlert" :size="14" class="mt-0.5 shrink-0" />
        <span>{{ warningText }}</span>
      </div>
    </section>

    <!-- 处理结果 -->
    <section
      v-if="resultList.length"
      class="mt-8 rounded-card-lg border border-linen-border bg-warm-sand p-6 shadow-subtle-2"
    >
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-subheading font-[480] text-charcoal">
          加水印结果（{{ resultList.length }}张）
        </h2>
        <button
          type="button"
          class="flex h-10 cursor-pointer items-center gap-1.5 rounded-pill border border-linen-border bg-parchment px-4 text-[13px] text-charcoal transition-colors hover:border-stone hover:bg-warm-sand"
          @click="downloadAllZip"
        >
          <z-icon :icon="Download" :size="15" />
          全部打包ZIP下载
        </button>
      </div>

      <p
        v-if="resultOutdated"
        class="mb-4 flex items-start gap-1.5 text-caption text-indigo-accent"
      >
        <z-icon :icon="TriangleAlert" :size="14" class="mt-0.5 shrink-0" />
        <span>水印设置已更新，当前下载结果仍是旧设置；重新点击「一键添加水印」即可更新。</span>
      </p>

      <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        <article
          v-for="item in resultList"
          :key="item.uid"
          class="rounded-card border border-linen-border bg-parchment p-3"
        >
          <img
            :src="item.objUrl"
            :alt="item.outputName"
            class="h-32 w-full rounded-img bg-warm-sand object-contain"
          />
          <p class="mt-2 break-all text-caption text-charcoal">{{ item.outputName }}</p>
          <p class="text-[12px] text-dim-gray">
            {{ item.width }}×{{ item.height }} · {{ formatFileSize(item.blob.size) }}
          </p>
          <button
            type="button"
            class="mt-2 h-9 w-full cursor-pointer rounded-pill bg-charcoal text-[13px] text-parchment transition-colors hover:bg-ink"
            @click="downloadSingle(item)"
          >
            下载
          </button>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Download,
  ImagePlus,
  RotateCcw,
  Stamp,
  Trash2,
  TriangleAlert,
  WandSparkles,
} from "lucide-vue-next";
import ZIcon from "@/components/z-icon/index.vue";
import ZUpload from "@/components/z-upload/index.vue";

/** 单个原图文件的展示数据 */
interface SourceItem {
  uid: number;
  name: string;
  file: File;
  objUrl: string;
  width: number;
  height: number;
}

/** 加水印后的结果数据 */
interface ResultItem {
  uid: number;
  outputName: string;
  blob: Blob;
  objUrl: string;
  width: number;
  height: number;
}

type WatermarkMode = "text" | "image";
type WatermarkLayout = "single" | "tile";
type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
type OutputFormat = "auto" | "jpeg" | "png" | "webp";

/** 传给 Canvas 绘制的水印配置快照 */
interface WatermarkOptions {
  mode: WatermarkMode;
  text: string;
  color: string;
  fontSizePercent: number;
  watermarkImage: HTMLImageElement | null;
  watermarkImageScale: number;
  opacity: number;
  rotation: number;
  layout: WatermarkLayout;
  position: WatermarkPosition;
  offsetXPercent: number;
  offsetYPercent: number;
  tileSpacingPercent: number;
  marginPercent: number;
  outputMime: string;
}

const MAX_FILE_MB = 100;
const MAX_TILE_COUNT = 4000;
const FONT_STACK = `"DM Sans Variable", "DM Sans", "Microsoft YaHei", sans-serif`;
const DEFAULT_SETTINGS = {
  text: "仅供预览",
  color: "#1c1c1c",
  fontSizePercent: 5,
  imageScale: 20,
  opacity: 45,
  rotation: 0,
  layout: "single" as WatermarkLayout,
  position: "bottom-right" as WatermarkPosition,
  offsetX: 0,
  offsetY: 0,
  tileSpacing: 40,
  margin: 3,
  format: "auto" as OutputFormat,
  quality: 92,
};

const watermarkModeOptions: Array<{ label: string; value: WatermarkMode }> = [
  { label: "文字水印", value: "text" },
  { label: "图片水印", value: "image" },
];
const watermarkLayoutOptions: Array<{ label: string; value: WatermarkLayout }> = [
  { label: "单个位置", value: "single" },
  { label: "全图平铺", value: "tile" },
];
const positionOptions: Array<{ label: string; value: WatermarkPosition }> = [
  { label: "左上", value: "top-left" },
  { label: "上中", value: "top-center" },
  { label: "右上", value: "top-right" },
  { label: "左中", value: "middle-left" },
  { label: "居中", value: "center" },
  { label: "右中", value: "middle-right" },
  { label: "左下", value: "bottom-left" },
  { label: "下中", value: "bottom-center" },
  { label: "右下", value: "bottom-right" },
];
const outputFormatOptions: Array<{ label: string; value: OutputFormat }> = [
  { label: "自动跟随原图", value: "auto" },
  { label: "JPG", value: "jpeg" },
  { label: "PNG", value: "png" },
  { label: "WebP", value: "webp" },
];

let uidSeed = 0;
let previewTimer: number | undefined;

const sourceList = ref<SourceItem[]>([]);
const sourceImages = new Map<number, HTMLImageElement>();
const resultList = ref<ResultItem[]>([]);
const watermarkImage = ref<HTMLImageElement | null>(null);
const watermarkFile = ref<File | null>(null);
const watermarkUrl = ref("");

const watermarkMode = ref<WatermarkMode>("text");
const watermarkText = ref(DEFAULT_SETTINGS.text);
const watermarkColor = ref(DEFAULT_SETTINGS.color);
const fontSizePercent = ref(DEFAULT_SETTINGS.fontSizePercent);
const watermarkImageScale = ref(DEFAULT_SETTINGS.imageScale);
const watermarkOpacity = ref(DEFAULT_SETTINGS.opacity);
const watermarkRotation = ref(DEFAULT_SETTINGS.rotation);
const watermarkLayout = ref(DEFAULT_SETTINGS.layout);
const watermarkPosition = ref(DEFAULT_SETTINGS.position);
const positionOffsetX = ref(DEFAULT_SETTINGS.offsetX);
const positionOffsetY = ref(DEFAULT_SETTINGS.offsetY);
const tileSpacingPercent = ref(DEFAULT_SETTINGS.tileSpacing);
const marginPercent = ref(DEFAULT_SETTINGS.margin);
const outputFormat = ref(DEFAULT_SETTINGS.format);
const outputQuality = ref(DEFAULT_SETTINGS.quality);

const previewCanvasRef = ref<HTMLCanvasElement | null>(null);
const processing = ref(false);
const isAddingFiles = ref(false);
const statusText = ref("");
const warningText = ref("");
const previewError = ref("");
const resultOutdated = ref(false);

const previewImage = computed(() => {
  const first = sourceList.value[0];
  return first ? sourceImages.get(first.uid) ?? null : null;
});
const canProcess = computed(() => {
  if (!sourceList.value.length) return false;
  if (watermarkMode.value === "text") return watermarkText.value.trim().length > 0;
  return Boolean(watermarkImage.value);
});

watch(
  [
    previewImage,
    watermarkImage,
    watermarkMode,
    watermarkText,
    watermarkColor,
    fontSizePercent,
    watermarkImageScale,
    watermarkOpacity,
    watermarkRotation,
    watermarkLayout,
    watermarkPosition,
    positionOffsetX,
    positionOffsetY,
    tileSpacingPercent,
    marginPercent,
    outputFormat,
  ],
  () => {
    if (resultList.value.length) resultOutdated.value = true;
    schedulePreview();
  },
  { immediate: true },
);

onUnmounted(() => {
  if (previewTimer) window.clearTimeout(previewTimer);
  clearSourceUrls();
  clearResultUrls();
  clearWatermarkUrl();
});

/** 生成唯一 ID */
function getUid(): number {
  uidSeed += 1;
  return Date.now() + uidSeed;
}

/** 格式化文件大小 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** 本地读取并解码图片 */
function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error(`无法解析图片：${file.name}`));
        return;
      }
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`图片读取失败：${file.name}`));
    };
    image.src = objectUrl;
  });
}

/** 添加原图 */
async function addSourceFiles(files: File[]) {
  if (!files.length) return;

  isAddingFiles.value = true;
  warningText.value = "";
  statusText.value = "图片读取中…";
  const invalidNames: string[] = [];

  try {
    for (const file of files) {
      try {
        const image = await loadImage(file);
        const uid = getUid();
        sourceImages.set(uid, image);
        sourceList.value.push({
          uid,
          name: file.name,
          file,
          objUrl: URL.createObjectURL(file),
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
        await nextTick();
      } catch (error) {
        invalidNames.push(file.name);
        console.error(error);
      }
    }

    if (invalidNames.length) {
      warningText.value = `已跳过无法读取的图片：${invalidNames.join("、")}`;
    }
    statusText.value = sourceList.value.length
      ? `已加载${sourceList.value.length}张图片，调整后可一键添加水印`
      : "";
  } finally {
    isAddingFiles.value = false;
    schedulePreview();
  }
}

/** 移除单张原图 */
function removeSource(item: SourceItem) {
  if (processing.value) return;
  URL.revokeObjectURL(item.objUrl);
  sourceImages.delete(item.uid);
  sourceList.value = sourceList.value.filter((source) => source.uid !== item.uid);
  clearResultUrls();
  resultList.value = [];
  resultOutdated.value = false;
  statusText.value = "";
  schedulePreview();
}

/** 清空全部原图 */
function clearSourceFiles() {
  if (processing.value) return;
  clearSourceUrls();
  clearResultUrls();
  sourceImages.clear();
  sourceList.value = [];
  resultList.value = [];
  resultOutdated.value = false;
  statusText.value = "";
  previewError.value = "";
}

/** 选择水印图片 */
async function handleWatermarkFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const image = await loadImage(file);
    clearWatermarkUrl();
    watermarkImage.value = image;
    watermarkFile.value = file;
    watermarkUrl.value = URL.createObjectURL(file);
    warningText.value = "";
    statusText.value = "水印图片已就绪";
  } catch (error) {
    console.error(error);
    warningText.value = `水印图片读取失败：${file.name}`;
  } finally {
    input.value = "";
  }
}

/** 移除水印图片 */
function clearWatermarkImage() {
  clearWatermarkUrl();
  watermarkImage.value = null;
  watermarkFile.value = null;
  watermarkUrl.value = "";
  statusText.value = "";
}

/** 恢复默认水印参数 */
function resetSettings() {
  watermarkMode.value = "text";
  watermarkText.value = DEFAULT_SETTINGS.text;
  watermarkColor.value = DEFAULT_SETTINGS.color;
  fontSizePercent.value = DEFAULT_SETTINGS.fontSizePercent;
  watermarkImageScale.value = DEFAULT_SETTINGS.imageScale;
  watermarkOpacity.value = DEFAULT_SETTINGS.opacity;
  watermarkRotation.value = DEFAULT_SETTINGS.rotation;
  watermarkLayout.value = DEFAULT_SETTINGS.layout;
  watermarkPosition.value = DEFAULT_SETTINGS.position;
  positionOffsetX.value = DEFAULT_SETTINGS.offsetX;
  positionOffsetY.value = DEFAULT_SETTINGS.offsetY;
  tileSpacingPercent.value = DEFAULT_SETTINGS.tileSpacing;
  marginPercent.value = DEFAULT_SETTINGS.margin;
  outputFormat.value = DEFAULT_SETTINGS.format;
  outputQuality.value = DEFAULT_SETTINGS.quality;
}

/** 延迟重绘预览，避免拖动滑杆时频繁绘制大图 */
function schedulePreview() {
  if (previewTimer) window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(renderPreview, 80);
}

/** 绘制第一张图的实时预览 */
function renderPreview() {
  const image = previewImage.value;
  const canvas = previewCanvasRef.value;
  if (!image || !canvas) return;

  try {
    const options = buildWatermarkOptions(sourceList.value[0]);
    drawWatermarkedImage(image, canvas, options);
    previewError.value = "";
  } catch (error) {
    console.error(error);
    previewError.value = "预览绘制失败，请检查水印图片或稍后重试";
  }
}

/** 根据当前 UI 状态生成绘制配置 */
function buildWatermarkOptions(source: SourceItem | undefined): WatermarkOptions {
  const outputMime =
    outputFormat.value === "auto" ? resolveAutoMime(source?.file.type) : `image/${outputFormat.value}`;

  return {
    mode: watermarkMode.value,
    text: watermarkText.value,
    color: watermarkColor.value,
    fontSizePercent: fontSizePercent.value,
    watermarkImage: watermarkImage.value,
    watermarkImageScale: watermarkImageScale.value,
    opacity: watermarkOpacity.value,
    rotation: watermarkRotation.value,
    layout: watermarkLayout.value,
    position: watermarkPosition.value,
    offsetXPercent: positionOffsetX.value,
    offsetYPercent: positionOffsetY.value,
    tileSpacingPercent: tileSpacingPercent.value,
    marginPercent: marginPercent.value,
    outputMime,
  };
}

/** 自动选择输出格式，未知格式统一输出 PNG */
function resolveAutoMime(sourceType: string | undefined): string {
  if (sourceType === "image/jpeg" || sourceType === "image/png" || sourceType === "image/webp") {
    return sourceType;
  }
  return "image/png";
}

/** 把原图与水印绘制到目标 Canvas */
function drawWatermarkedImage(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  options: WatermarkOptions,
): void {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器不支持 Canvas 2D");

  ctx.clearRect(0, 0, width, height);
  if (options.outputMime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(image, 0, 0, width, height);
  drawWatermark(ctx, width, height, options);
}

/** 在画布上绘制文字或图片水印 */
function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  options: WatermarkOptions,
): void {
  if (options.mode === "image" && !options.watermarkImage) return;
  if (options.mode === "text" && !options.text.trim()) return;

  const shortSide = Math.min(canvasWidth, canvasHeight);
  let watermarkWidth: number;
  let watermarkHeight: number;
  let drawUnit: (centerX: number, centerY: number) => void;

  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, options.opacity / 100));

  if (options.mode === "text") {
    const fontSize = Math.max(10, Math.round((shortSide * options.fontSizePercent) / 100));
    ctx.font = `600 ${fontSize}px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = options.color;
    watermarkWidth = ctx.measureText(options.text).width;
    watermarkHeight = fontSize * 1.25;
    drawUnit = (centerX, centerY) => ctx.fillText(options.text, centerX, centerY);
  } else {
    const image = options.watermarkImage!;
    watermarkWidth = (shortSide * options.watermarkImageScale) / 100;
    watermarkHeight = watermarkWidth * (image.naturalHeight / image.naturalWidth);
    drawUnit = (centerX, centerY) =>
      ctx.drawImage(image, centerX - watermarkWidth / 2, centerY - watermarkHeight / 2, watermarkWidth, watermarkHeight);
  }

  if (options.layout === "single") {
    const margin = (shortSide * options.marginPercent) / 100;
    const offsetX = (canvasWidth * options.offsetXPercent) / 100;
    const offsetY = (canvasHeight * options.offsetYPercent) / 100;
    const centerX = getAxisCoordinate(
      options.position.includes("left"),
      options.position.includes("right"),
      canvasWidth,
      watermarkWidth,
      margin + offsetX,
    );
    const centerY = getAxisCoordinate(
      options.position.includes("top"),
      options.position.includes("bottom"),
      canvasHeight,
      watermarkHeight,
      margin + offsetY,
    );
    ctx.translate(centerX, centerY);
    ctx.rotate((options.rotation * Math.PI) / 180);
    drawUnit(0, 0);
  } else {
    let stepX = watermarkWidth + (Math.max(watermarkWidth, watermarkHeight) * options.tileSpacingPercent) / 100;
    let stepY = watermarkHeight + (Math.max(watermarkWidth, watermarkHeight) * options.tileSpacingPercent) / 100;
    const radius = Math.hypot(canvasWidth, canvasHeight) / 2;
    const rawTileCount = ((radius * 2) / stepX) * ((radius * 2) / stepY);
    if (rawTileCount > MAX_TILE_COUNT) {
      const factor = Math.sqrt(rawTileCount / MAX_TILE_COUNT);
      stepX *= factor;
      stepY *= factor;
    }

    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((options.rotation * Math.PI) / 180);
    for (let y = -radius; y <= radius; y += stepY) {
      for (let x = -radius; x <= radius; x += stepX) {
        drawUnit(x, y);
      }
    }
  }

  ctx.restore();
}

/** 根据位置计算水印中心点坐标 */
function getAxisCoordinate(
  isStart: boolean,
  isEnd: boolean,
  canvasSize: number,
  watermarkSize: number,
  offset: number,
): number {
  if (isStart) return Math.max(watermarkSize / 2, watermarkSize / 2 + offset);
  if (isEnd) return Math.min(canvasSize - watermarkSize / 2, canvasSize - watermarkSize / 2 + offset);
  return canvasSize / 2 + offset;
}

/** 批量生成加水印图片 */
async function applyWatermarks() {
  if (!canProcess.value || processing.value) return;

  processing.value = true;
  warningText.value = "";
  previewError.value = "";
  clearResultUrls();
  resultList.value = [];
  resultOutdated.value = false;

  const usedNames = new Set<string>();
  try {
    for (let index = 0; index < sourceList.value.length; index += 1) {
      const source = sourceList.value[index];
      statusText.value = `正在处理 ${index + 1}/${sourceList.value.length}：${source.name}`;

      const image = sourceImages.get(source.uid);
      if (!image) throw new Error(`原图已失效：${source.name}`);

      const canvas = document.createElement("canvas");
      drawWatermarkedImage(image, canvas, buildWatermarkOptions(source));
      const mime = buildWatermarkOptions(source).outputMime;
      const quality = outputQuality.value / 100;
      const blob = await canvasToBlob(canvas, mime, quality);
      const actualMime = blob.type || mime;
      const outputName = createOutputName(source.name, actualMime, usedNames);
      const objUrl = URL.createObjectURL(blob);

      resultList.value.push({
        uid: getUid(),
        outputName,
        blob,
        objUrl,
        width: canvas.width,
        height: canvas.height,
      });
    }

    statusText.value = "全部处理完成！可在本地下载单张图片或 ZIP 包。";
  } catch (error) {
    console.error(error);
    statusText.value = "";
    warningText.value = error instanceof Error ? error.message : "图片处理失败，请稍后重试";
  } finally {
    processing.value = false;
  }
}

/** Canvas 转 Blob */
function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("当前浏览器不支持所选输出格式"));
      },
      mime,
      mime === "image/png" ? undefined : quality,
    );
  });
}

/** 生成不重复的输出文件名 */
function createOutputName(sourceName: string, mime: string, usedNames: Set<string>): string {
  const baseName = sourceName.replace(/\.[^./\\]+$/, "") || "image";
  const extension = getExtension(mime);
  let outputName = `${baseName}-watermark.${extension}`;
  let suffix = 1;
  while (usedNames.has(outputName)) {
    suffix += 1;
    outputName = `${baseName}-watermark-${suffix}.${extension}`;
  }
  usedNames.add(outputName);
  return outputName;
}

/** 从 MIME 获取扩展名 */
function getExtension(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

/** 单张下载 */
function downloadSingle(item: ResultItem) {
  saveAs(item.blob, item.outputName);
}

/** 全部打包下载 */
async function downloadAllZip() {
  if (!resultList.value.length) return;

  const zip = new JSZip();
  for (const item of resultList.value) {
    zip.file(item.outputName, item.blob);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "watermarked-images.zip");
}

/** 清空原图 URL */
function clearSourceUrls() {
  for (const item of sourceList.value) URL.revokeObjectURL(item.objUrl);
}

/** 清空结果 URL */
function clearResultUrls() {
  for (const item of resultList.value) URL.revokeObjectURL(item.objUrl);
}

/** 清空水印图片 URL */
function clearWatermarkUrl() {
  if (watermarkUrl.value) URL.revokeObjectURL(watermarkUrl.value);
}
</script>
