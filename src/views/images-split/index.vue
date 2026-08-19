<template>
  <div class="mx-auto max-w-3xl px-6 py-12">
    <!-- 页面头部 -->
    <div class="flex items-start gap-4 mb-10">
      <div
        class="flex h-11 w-11 items-center justify-center rounded-card bg-charcoal text-parchment"
      >
        <z-icon :icon="GridIcon" :size="22" />
      </div>
      <div>
        <h1 class="text-heading-sm font-[480] text-charcoal">图片宫格分割</h1>
        <p class="mt-1 text-caption text-dim-gray">
          将图片分割为四宫格、九宫格、十六宫格，支持自定义行列，本地浏览器运算
        </p>
      </div>
    </div>

    <!-- 上传区域 -->
    <z-upload
      accept="image/*"
      multiple
      title="点击或拖拽图片到此处上传"
      :subtitle="`支持多张，单图最大 ${MAX_FILE_MB}MB`"
      :max-size-mb="MAX_FILE_MB"
      @select="handleInputFiles"
    />

    <!-- 设置面板 -->
    <div
      class="rounded-card-lg border border-linen-border bg-parchment p-6 sm:p-7 shadow-subtle-2 my-6"
    >
      <h3 class="text-subheading font-[480] text-charcoal mb-4">分割参数</h3>

      <!-- 预置宫格chip选择 -->
      <div class="flex flex-wrap gap-2 mb-5">
        <button
          v-for="preset in presets"
          :key="preset.label"
          class="rounded-pill border px-3.5 py-2 text-[13px] cursor-pointer transition-all"
          :class="[
            gridRows === preset.rows && gridCols === preset.cols
              ? 'border-charcoal bg-charcoal font-medium text-parchment'
              : 'border-linen-border bg-parchment text-dim-gray hover:border-stone hover:text-charcoal',
          ]"
          @click="setPreset(preset.rows, preset.cols)"
        >
          {{ preset.label }}
        </button>
      </div>

      <div class="flex flex-wrap gap-4 items-end mb-4">
        <div>
          <label class="block text-caption text-dim-gray mb-1">行数</label>
          <input
            v-model.number="gridRows"
            type="number"
            min="2"
            max="10"
            class="h-10 rounded-input border border-linen-border bg-parchment px-3 text-[15px] placeholder:text-dim-gray/70 focus:border-indigo-accent focus:outline-none w-24"
          />
        </div>
        <div>
          <label class="block text-caption text-dim-gray mb-1">列数</label>
          <input
            v-model.number="gridCols"
            type="number"
            min="2"
            max="10"
            class="h-10 rounded-input border border-linen-border bg-parchment px-3 text-[15px] placeholder:text-dim-gray/70 focus:border-indigo-accent focus:outline-none w-24"
          />
        </div>
        <button
          class="h-11 rounded-pill bg-charcoal px-6 text-[15px] font-medium text-parchment hover:bg-ink disabled:cursor-not-allowed disabled:bg-stone disabled:text-dim-gray hover:cursor-pointer"
          :disabled="processing || sourceImageList.length === 0 || !isValidGrid"
          @click="handleSplitAll"
        >
          {{ processing ? "分割中…" : "开始分割图片" }}
        </button>
      </div>

      <!-- 分割线开关 -->
      <div class="flex items-center gap-3 mb-3">
        <button
          class="h-10 rounded-pill border px-4 text-[14px] transition-all flex items-center gap- hover:cursor-pointer"
          :class="[
            showGridOverlay
              ? 'border-charcoal bg-charcoal text-parchment'
              : 'border-linen-border bg-parchment text-charcoal hover:border-stone hover:bg-warm-sand',
          ]"
          @click="toggleGridOverlay"
        >
          <z-icon :icon="GridIcon" :size="16" />
          {{ showGridOverlay ? "关闭预览分割线" : "开启预览分割线" }}
        </button>
      </div>

      <div
        v-if="warnText"
        class="flex items-center gap-1.5 text-caption text-indigo-accent mt-4"
      >
        <z-icon :icon="TriangleAlert" :size="14" />
        <span>{{ warnText }}</span>
      </div>
    </div>

    <!-- 原图列表：叠加分割线canvas，由showGridOverlay控制显示隐藏 -->
    <div v-if="sourceImageList.length">
      <h3 class="text-subheading font-[480] text-charcoal mb-3">
        已上传原图（{{ sourceImageList.length }}张）
      </h3>
      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 mb-8"
      >
        <div
          v-for="item in sourceImageList"
          :key="item.uid"
          class="rounded-card border border-linen-border bg-parchment p-3 relative overflow-hidden"
        >
          <img
            :src="item.objectUrl"
            alt=""
            class="w-full h-30 object-contain bg-warm-sand rounded-img"
          />
          <!-- 分割线画布，v‑show控制显示隐藏 -->
          <canvas
            ref="drawCanvasRefs"
            v-show="showGridOverlay"
            class="absolute inset-0 pointer-events-none"
          />
          <div class="mt-2 text-caption text-dim-gray break-all">
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 分割结果：分割后小图实时预览 -->
    <div v-if="splitResultGroups.length">
      <div
        class="rounded-card-lg border border-linen-border bg-warm-sand p-6 shadow-subtle-2"
      >
        <h3 class="text-subheading font-[480] text-charcoal mb-4">
          分割结果（小图实时预览）
        </h3>

        <div
          v-for="group in splitResultGroups"
          :key="group.uid"
          class="mb-8 last:mb-0"
        >
          <div class="flex justify-between items-center mb-3">
            <span class="text-body font-medium text-charcoal"
              >原图：{{ group.sourceName }}</span
            >
            <button
              class="h-10 rounded-pill border border-linen-border bg-parchment px-3 text-caption text-charcoal hover:bg-warm-sand hover:cursor-pointer"
              @click="downloadGroupZip(group)"
            >
              打包本组ZIP
            </button>
          </div>
          <!-- 分割碎片实时预览网格 -->
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2"
          >
            <div
              v-for="sub in group.pieces"
              :key="sub.uid"
              class="rounded-card border border-linen-border bg-parchment p-2"
            >
              <!-- 小图实时预览 -->
              <img
                :src="sub.objectUrl"
                alt="分割碎片"
                class="w-full h-22.5 object-contain bg-warm-sand rounded-img"
              />
              <div class="mt-1 text-[12px] text-dim-gray text-center">
                {{ sub.filename }}
              </div>
              <button
                class="w-full mt-1 h-8 rounded-pill border border-linen-border bg-parchment text-[12px] text-charcoal hover:bg-warm-sand"
                @click="downloadSinglePiece(sub)"
              >
                下载
              </button>
            </div>
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-linen-border">
          <button
            class="h-11 rounded-pill bg-charcoal px-6 text-[15px] font-medium text-parchment hover:bg-ink hover:cursor-pointer"
            @click="downloadAllZip"
          >
            全部结果打包下载ZIP
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch, nextTick } from "vue";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { GridIcon, TriangleAlert } from "lucide-vue-next";
import ZIcon from "@/components/z-icon/index.vue";
import ZUpload from "@/components/z-upload/index.vue";

// ========== 常量配置 ==========
const MAX_FILE_MB = 50;
const MIN_GRID = 2;
const MAX_GRID = 10;

interface PresetItem {
  label: string;
  rows: number;
  cols: number;
}
const presets: PresetItem[] = [
  { label: "四宫格 2×2", rows: 2, cols: 2 },
  { label: "九宫格 3×3", rows: 3, cols: 3 },
  { label: "十六宫格 4×4", rows: 4, cols: 4 },
];

// 原图项
interface SourceImageItem {
  uid: number;
  name: string;
  file: File;
  objectUrl: string;
}

// 分割碎片
interface SplitPiece {
  uid: number;
  filename: string;
  blob: Blob;
  objectUrl: string;
}

// 一组：一张原图分割出来的全部碎片
interface SplitResultGroup {
  uid: number;
  sourceName: string;
  pieces: SplitPiece[];
}

// ========== 状态 ==========
const drawCanvasRefs = ref<HTMLCanvasElement[]>([]);
const processing = ref(false);
const warnText = ref("");

// 分割预览分割线开关
const showGridOverlay = ref(true);

const gridRows = ref(2);
const gridCols = ref(2);

const sourceImageList = ref<SourceImageItem[]>([]);
const splitResultGroups = ref<SplitResultGroup[]>([]);

// 内存回收 url 集合
const revokeUrls: string[] = [];

// 行列合法性校验
const isValidGrid = computed(() => {
  const r = gridRows.value;
  const c = gridCols.value;
  return (
    Number.isInteger(r) &&
    Number.isInteger(c) &&
    r >= MIN_GRID &&
    r <= MAX_GRID &&
    c >= MIN_GRID &&
    c <= MAX_GRID
  );
});

/** 切换分割线开关 */
function toggleGridOverlay() {
  showGridOverlay.value = !showGridOverlay.value;
  if (showGridOverlay.value) {
    redrawAllGridLine();
  }
}

/** 设置预置行列 */
function setPreset(rows: number, cols: number) {
  gridRows.value = rows;
  gridCols.value = cols;
}

/** 接收 z-upload 过滤后的图片文件，生成预览url */
async function handleInputFiles(files: File[]) {
  for (const file of files) {
    const objUrl = URL.createObjectURL(file);
    revokeUrls.push(objUrl);
    sourceImageList.value.push({
      uid: Date.now() + Math.random(),
      name: file.name,
      file,
      objectUrl: objUrl,
    });
  }
  await nextTick();
  if (showGridOverlay.value) {
    redrawAllGridLine();
  }
}

/** 在预览canvas上绘制分割网格线 */
function drawGridLine() {
  drawCanvasRefs.value.forEach((canvas) => {
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const imgDom = parent.querySelector("img")!;
    const rect = imgDom.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 1;

    const r = gridRows.value;
    const c = gridCols.value;
    // 横线
    for (let i = 1; i < r; i++) {
      const y = (canvas.height / r) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    // 竖线
    for (let i = 1; i < c; i++) {
      const x = (canvas.width / c) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
  });
}

/** 重绘全部预览分割线 */
async function redrawAllGridLine() {
  await nextTick();
  drawGridLine();
}

// 行列改变，开启分割线时自动重绘
watch([gridRows, gridCols], () => {
  if (
    sourceImageList.value.length > 0 &&
    isValidGrid.value &&
    showGridOverlay.value
  ) {
    redrawAllGridLine();
  }
});

/**
 * 单张图片分割为 rows × cols 碎片
 * @param file 原始图片File
 * @param rows 行数
 * @param cols 列数
 */
async function splitImageToPieces(
  file: File,
  rows: number,
  cols: number,
): Promise<SplitPiece[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    revokeUrls.push(url);
    img.src = url;

    img.onload = () => {
      const pieceW = Math.floor(img.width / cols);
      const pieceH = Math.floor(img.height / rows);
      const pieces: SplitPiece[] = [];

      let index = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement("canvas");
          canvas.width = pieceW;
          canvas.height = pieceH;
          const ctx = canvas.getContext("2d")!;

          const sx = c * pieceW;
          const sy = r * pieceH;
          ctx.drawImage(img, sx, sy, pieceW, pieceH, 0, 0, pieceW, pieceH);

          canvas.toBlob((blob) => {
            if (!blob) return;
            const objUrl = URL.createObjectURL(blob);
            revokeUrls.push(objUrl);
            index++;
            pieces.push({
              uid: Date.now() + Math.random() + index,
              filename: `${r + 1}_${c + 1}.png`,
              blob,
              objectUrl: objUrl,
            });

            if (pieces.length === rows * cols) {
              resolve(pieces);
            }
          }, "image/png");
        }
      }
    };
  });
}

/** 批量分割全部已上传图片 */
async function handleSplitAll() {
  if (!isValidGrid.value) {
    warnText.value = `行列必须为 ${MIN_GRID}‑${MAX_GRID} 的整数`;
    return;
  }
  if (sourceImageList.value.length === 0) return;

  processing.value = true;
  warnText.value = "";
  splitResultGroups.value = [];

  try {
    for (const sourceItem of sourceImageList.value) {
      const pieces = await splitImageToPieces(
        sourceItem.file,
        gridRows.value,
        gridCols.value,
      );
      splitResultGroups.value.push({
        uid: Date.now() + Math.random(),
        sourceName: sourceItem.name,
        pieces,
      });
    }
  } catch (err) {
    console.error(err);
    warnText.value = "图片分割出错，请尝试其他图片";
  } finally {
    processing.value = false;
  }
}

/** 下载单个碎片 */
function downloadSinglePiece(sub: SplitPiece) {
  saveAs(sub.blob, sub.filename);
}

/** 下载某一组（一张原图分割出来的全部碎片） */
async function downloadGroupZip(group: SplitResultGroup) {
  const zip = new JSZip();
  group.pieces.forEach((p) => {
    zip.file(p.filename, p.blob);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${group.sourceName}_grid.zip`);
}

/** 全部结果打包一个ZIP */
async function downloadAllZip() {
  const zip = new JSZip();
  splitResultGroups.value.forEach((group) => {
    const folder = zip.folder(group.sourceName)!;
    group.pieces.forEach((p) => {
      folder.file(p.filename, p.blob);
    });
  });
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "grid_split_all.zip");
}

/** 组件销毁，释放全部ObjectURL，防止内存泄漏 */
onUnmounted(() => {
  revokeUrls.forEach((u) => URL.revokeObjectURL(u));
});
</script>

<style scoped>
.relative {
  position: relative;
}
.absolute {
  position: absolute;
}
.inset-0 {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.pointer-events-none {
  pointer-events: none;
}
.overflow-hidden {
  overflow: hidden;
}
</style>
