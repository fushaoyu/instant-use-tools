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
          批量图片尺寸修改器
        </h2>
        <p class="mt-1 text-caption text-dim-gray">
          本地处理，支持 JPG / PNG / GIF / TIFF / BMP，不限大小与数量
        </p>
      </div>
    </header>

    <!-- 上传区 -->
    <z-upload
      accept=".jpg,.jpeg,.png,.gif,.tiff,.bmp"
      multiple
      title="点击或拖拽图片到此处上传"
      subtitle="支持多选，JPG / PNG / GIF / TIFF / BMP，不限制数量与大小"
      @select="addFiles"
    />

    <p class="mt-3 text-[15px] text-charcoal">
      已上传图片：<span class="font-semibold">{{ originItems.length }}</span> 张
    </p>

    <!-- 设置面板 -->
    <section
      class="mt-6 rounded-card-lg border border-linen-border bg-parchment p-6 shadow-subtle-2 sm:p-7"
    >
      <!-- 尺寸方式：像素 / 百分比 -->
      <div class="flex items-center justify-between gap-4">
        <span class="text-caption font-medium text-charcoal">尺寸方式</span>
        <div class="flex rounded-pill bg-warm-sand p-1">
          <button
            type="button"
            class="h-8 cursor-pointer rounded-full px-4 text-[13px] font-medium transition-colors"
            :class="
              sizeMode === 'px'
                ? 'bg-charcoal text-parchment'
                : 'text-dim-gray hover:text-charcoal'
            "
            @click="sizeMode = 'px'"
          >
            像素尺寸
          </button>
          <button
            type="button"
            class="h-8 cursor-pointer rounded-full px-4 text-[13px] font-medium transition-colors"
            :class="
              sizeMode === 'percent'
                ? 'bg-charcoal text-parchment'
                : 'text-dim-gray hover:text-charcoal'
            "
            @click="sizeMode = 'percent'"
          >
            百分比
          </button>
        </div>
      </div>

      <!-- 像素模式：目标宽高，勾选保持长宽比时仅一边可输入 -->
      <div v-if="sizeMode === 'px'" class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:items-end">
        <label class="block">
          <span class="mb-1.5 block text-caption font-medium text-charcoal"
            >目标宽度（px）</span
          >
          <input
            v-model.number="targetW"
            type="number"
            min="1"
            placeholder="宽度"
            :disabled="lockRatio && !!targetH"
            class="h-10 w-full rounded-input border border-linen-border bg-parchment px-3 text-[15px] text-charcoal placeholder:text-dim-gray/70 focus:border-indigo-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-warm-sand disabled:text-dim-gray"
          />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-caption font-medium text-charcoal"
            >目标高度（px）</span
          >
          <input
            v-model.number="targetH"
            type="number"
            min="1"
            placeholder="高度"
            :disabled="lockRatio && !!targetW"
            class="h-10 w-full rounded-input border border-linen-border bg-parchment px-3 text-[15px] text-charcoal placeholder:text-dim-gray/70 focus:border-indigo-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-warm-sand disabled:text-dim-gray"
          />
        </label>
      </div>

      <!-- 保持长宽比：勾选后另一边自动换算 -->
      <label
        v-if="sizeMode === 'px'"
        class="mt-4 flex cursor-pointer items-center gap-2 text-[15px] text-charcoal"
      >
        <input
          v-model="lockRatio"
          type="checkbox"
          class="h-4 w-4 cursor-pointer accent-indigo-accent"
        />
        保持长宽比
        <span class="text-caption text-dim-gray"
          >（仅需输入一边，另一边按首张图片比例自动换算；关闭后拉伸填满目标尺寸）</span
        >
      </label>

      <!-- 百分比模式 -->
      <div v-else class="mt-4">
        <label class="block">
          <span class="mb-1.5 block text-caption font-medium text-charcoal">
            缩放比例
            <span class="font-semibold text-charcoal">{{ scalePercent }}%</span>
          </span>
          <input
            v-model.number="scalePercent"
            type="range"
            min="1"
            max="200"
            class="w-full cursor-pointer accent-indigo-accent"
          />
        </label>
        <p class="mt-2 text-caption text-dim-gray">
          按每张图原始尺寸的百分比缩放，始终保持长宽比；超过 100% 为放大
        </p>
      </div>

      <!-- 智能保护：小图不放大 -->
      <label class="mt-5 flex cursor-pointer items-start gap-2">
        <input
          v-model="smartNoUpscale"
          type="checkbox"
          class="mt-0.5 h-4 w-4 cursor-pointer accent-indigo-accent"
        />
        <span>
          <span class="text-[15px] text-charcoal"
            >智能保护：小于目标尺寸的图片不放大</span
          >
          <span class="block text-caption text-dim-gray"
            >配合“保持长宽比”使用即等效于等比缩小：原图大于目标时缩小，小于目标时保持原尺寸</span
          >
        </span>
      </label>

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
          :disabled="processing || !originItems.length"
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
          :disabled="!resultItems.length"
          @click="downloadZip"
        >
          <z-icon :icon="Archive" :size="16" aria-hidden="true" />
          打包全部下载 ZIP
        </button>
      </div>

      <p class="mt-4 flex items-start gap-1.5 text-caption text-indigo-accent">
        <z-icon :icon="TriangleAlert" :size="14" class="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          所有图片在浏览器本地运算，不会上传到任何服务器；GIF 动图输出为静态图（仅第一帧），TIFF / BMP 能否解码取决于浏览器支持；PNG 输出忽略画质参数
        </span>
      </p>
      <p
        v-if="warnText"
        class="mt-3 flex items-start gap-1.5 text-caption text-indigo-accent"
      >
        <z-icon :icon="TriangleAlert" :size="14" class="mt-0.5 shrink-0" aria-hidden="true" />
        <span>{{ warnText }}</span>
      </p>
    </section>

    <!-- 原图预览 -->
    <section class="mt-8">
      <h3 class="text-subheading font-medium text-charcoal">原图预览</h3>
      <div class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
        <div
          v-for="item in originItems"
          :key="item.uid"
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
          <div class="text-[12px] text-dim-gray">
            {{ item.loadFailed ? "无法读取" : item.width ? `${item.width} × ${item.height}` : "读取尺寸中…" }}
          </div>
        </div>
      </div>
    </section>

    <!-- 处理结果预览 -->
    <section class="mt-8">
      <h3 class="text-subheading font-medium text-charcoal">处理结果预览</h3>
      <div class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
        <div
          v-for="(item, idx) in resultItems"
          :key="item.uid"
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
          <div class="text-[12px] text-dim-gray">
            {{ item.width }} × {{ item.height }} · {{ formatFileSize(item.blob.size) }}
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
import { ref, watch, onUnmounted } from "vue";
import { Archive, LoaderCircle, Scaling, TriangleAlert } from "lucide-vue-next";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import ZIcon from "@/components/z-icon/index.vue";
import ZUpload from "@/components/z-upload/index.vue";

type SizeMode = "px" | "percent";
type OutputMime = "image/png" | "image/jpeg" | "image/webp";

const OUTPUT_EXT: Record<OutputMime, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

interface OriginItem {
  uid: number;
  file: File;
  name: string;
  url: string;
  width: number;
  height: number;
  loadFailed: boolean;
}

interface ResultItem {
  uid: number;
  blob: Blob;
  name: string;
  url: string;
  width: number;
  height: number;
}

let uidSeed = 0;
function nextUid(): number {
  return ++uidSeed;
}

const sizeMode = ref<SizeMode>("px");
const targetW = ref<number | null>(null);
const targetH = ref<number | null>(null);
const scalePercent = ref(50);
const lockRatio = ref(true);
const smartNoUpscale = ref(true);
const outputType = ref<OutputMime>("image/png");
const quality = ref(95);

const originItems = ref<OriginItem[]>([]);
const resultItems = ref<ResultItem[]>([]);
const processing = ref(false);
const warnText = ref("");

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

/** 读取图片原始尺寸，失败返回 null */
function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** 首张图片的宽高比（宽/高），勾选保持长宽比时用于联动换算另一边 */
const originRatio = ref<number | null>(null);

watch(
  () => originItems.value[0]?.width,
  (w) => {
    const first = originItems.value[0];
    if (!first || !w || !first.height) {
      originRatio.value = null;
      return;
    }
    originRatio.value = w / first.height;
    syncRatio();
  },
);

/** 勾选保持长宽比时，宽高互相联动：以已填一边为基准换算另一边（等值判断避免循环） */
watch(targetW, (w) => {
  if (!lockRatio.value) return;
  if (w && originRatio.value) syncRatio();
  else if (!w && targetH.value) targetH.value = null; // 清空换算值，恢复可输入
});
watch(targetH, (h) => {
  if (!lockRatio.value) return;
  if (h && originRatio.value) syncRatio();
  else if (!h && targetW.value) targetW.value = null;
});
watch(lockRatio, (on) => {
  if (on) syncRatio();
});

/** 换算另一边：宽度有值则按比例算高度，否则按高度算宽度 */
function syncRatio() {
  const r = originRatio.value;
  if (!lockRatio.value || !r) return;
  if (targetW.value) {
    const h = Math.round(targetW.value / r);
    if (h !== targetH.value) targetH.value = h;
  } else if (targetH.value) {
    const w = Math.round(targetH.value * r);
    if (w !== targetW.value) targetW.value = w;
  }
}

/** 接收 z-upload 过滤后的图片文件 */
function addFiles(files: File[]) {
  for (const file of files) {
    const item: OriginItem = {
      uid: nextUid(),
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      width: 0,
      height: 0,
      loadFailed: false,
    };
    originItems.value.push(item);
    readImageSize(file).then((dim) => {
      if (dim) {
        item.width = dim.width;
        item.height = dim.height;
      } else {
        item.loadFailed = true;
      }
    });
  }
}

/**
 * 计算目标尺寸。
 * 智能保护开启时，原图不大于目标尺寸则原样输出（不放大）。
 */
function computeTargetSize(imgW: number, imgH: number): { width: number; height: number } {
  if (sizeMode.value === "percent") {
    const ratio = scalePercent.value / 100;
    if (smartNoUpscale.value && ratio >= 1) return { width: imgW, height: imgH };
    return {
      width: Math.max(1, Math.round(imgW * ratio)),
      height: Math.max(1, Math.round(imgH * ratio)),
    };
  }
  if (!lockRatio.value) {
    // 统一尺寸（拉伸填满）
    if (smartNoUpscale.value && imgW <= targetW.value! && imgH <= targetH.value!) {
      return { width: imgW, height: imgH };
    }
    return { width: targetW.value!, height: targetH.value! };
  }
  // 保持长宽比：等比缩放，未填写的边不限；配合智能保护即"只缩不放"
  const scales: number[] = [];
  if (targetW.value) scales.push(targetW.value / imgW);
  if (targetH.value) scales.push(targetH.value / imgH);
  if (!scales.length) return { width: imgW, height: imgH };
  const s = Math.min(...scales);
  if (smartNoUpscale.value && s >= 1) return { width: imgW, height: imgH };
  return {
    width: Math.max(1, Math.round(imgW * s)),
    height: Math.max(1, Math.round(imgH * s)),
  };
}

/** 单张图片缩放，返回输出 Blob 与实际尺寸；解码失败返回 null */
function resizeImage(
  file: File,
): Promise<{ blob: Blob; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const size = computeTargetSize(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, size.width, size.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(
            blob
              ? { blob, width: size.width, height: size.height }
              : null,
          );
        },
        outputType.value,
        quality.value / 100,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
}

/** 按输出格式替换文件扩展名 */
function makeOutputName(name: string): string {
  return name.replace(/\.\w+$/, "") + OUTPUT_EXT[outputType.value];
}

/** 批量处理 */
async function handleProcess() {
  if (!originItems.value.length) {
    alert("请先上传图片！");
    return;
  }
  if (sizeMode.value === "px") {
    if (lockRatio.value) {
      if (!targetW.value && !targetH.value) {
        alert("请填写目标宽度或目标高度（保持长宽比时另一边自动换算）");
        return;
      }
    } else if (!targetW.value || !targetH.value) {
      alert("关闭“保持长宽比”后需要同时填写目标宽度与目标高度（拉伸填满）");
      return;
    }
  } else if (!scalePercent.value || scalePercent.value <= 0) {
    alert("请填写有效的缩放百分比");
    return;
  }

  processing.value = true;
  resultItems.value = [];
  warnText.value = "";
  const failed: string[] = [];

  try {
    for (const item of originItems.value) {
      if (item.loadFailed) {
        failed.push(item.name);
        continue;
      }
      const res = await resizeImage(item.file);
      if (!res) {
        failed.push(item.name);
        continue;
      }
      resultItems.value.push({
        uid: nextUid(),
        blob: res.blob,
        name: makeOutputName(item.name),
        url: URL.createObjectURL(res.blob),
        width: res.width,
        height: res.height,
      });
    }
    if (failed.length) {
      warnText.value = `处理失败（浏览器无法解码）：${failed.join("、")}`;
    }
    alert(`处理完成，共 ${resultItems.value.length} 张图片，失败 ${failed.length} 张`);
  } finally {
    processing.value = false;
  }
}

/** 单张下载 */
function saveSingle(index: number) {
  const item = resultItems.value[index];
  if (item) saveAs(item.blob, item.name);
}

/** ZIP 打包 */
async function downloadZip() {
  const zip = new JSZip();
  resultItems.value.forEach((item) => {
    zip.file(item.name, item.blob);
  });
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "缩放图片合集.zip");
}

// 组件销毁，释放所有预览 URL，防止内存泄漏
onUnmounted(() => {
  originItems.value.forEach((item) => URL.revokeObjectURL(item.url));
  resultItems.value.forEach((item) => URL.revokeObjectURL(item.url));
});
</script>
