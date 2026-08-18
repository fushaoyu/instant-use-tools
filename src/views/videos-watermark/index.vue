<template>
  <div class="mx-auto max-w-3xl px-6 py-12">
    <!-- 页头 -->
    <header class="mb-8 flex items-start gap-4">
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-charcoal text-parchment"
      >
        <z-icon :icon="Clapperboard" :size="20" aria-hidden="true" />
      </span>
      <div>
        <h2 class="text-heading-sm font-semibold text-charcoal">批量视频加水印</h2>
        <p class="mt-1 text-caption text-dim-gray">
          原生浏览器 API 处理，带处理计时，全程本地运算
        </p>
      </div>
    </header>

    <!-- 上传面板 -->
    <section
      class="rounded-card-lg border border-linen-border bg-parchment p-6 shadow-subtle-2 sm:p-7"
    >
      <label class="block">
        <span class="mb-1.5 block text-caption font-medium text-charcoal"
          >水印文字</span
        >
        <input
          v-model="watermarkText"
          type="text"
          maxlength="30"
          placeholder="工具箱水印"
          class="h-10 w-full rounded-input border border-linen-border bg-parchment px-3 text-[15px] text-charcoal placeholder:text-dim-gray/70 focus:border-indigo-accent focus:outline-none"
        />
      </label>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept="video/mp4"
        :disabled="processing"
        class="mt-4 block w-full cursor-pointer rounded-input border border-linen-border bg-warm-sand px-4 py-3 text-[15px] text-charcoal file:mr-3 file:cursor-pointer file:rounded-pill file:border-0 file:bg-charcoal file:px-3.5 file:py-1.5 file:text-caption file:font-medium file:text-parchment hover:file:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
        @change="onFileSelect"
      />
      <div v-if="totalInfo" class="mt-4 text-[15px] font-medium text-charcoal">
        {{ totalInfo }}
      </div>
      <div v-if="statusTip" class="mt-1.5 text-[15px] text-charcoal">
        {{ statusTip }}
      </div>
      <p class="mt-4 flex items-center gap-1.5 text-caption text-indigo-accent">
        <z-icon :icon="TriangleAlert" :size="14" class="shrink-0" aria-hidden="true" />
        单视频最大 {{ MAX_FILE_SIZE_MB }}MB，仅支持 MP4 短视频
      </p>
    </section>

    <!-- 处理结果列表 -->
    <section
      v-show="resultList.length > 0"
      class="mt-6 rounded-card-lg border border-linen-border bg-parchment p-6 shadow-subtle-2 sm:p-7"
    >
      <h3 class="text-subheading font-medium text-charcoal">处理完成列表</h3>
      <div
        v-for="item in resultList"
        :key="item.tempId"
        class="flex items-center justify-between gap-4 border-b border-linen-border py-3.5 last:border-b-0"
      >
        <div class="min-w-0 flex-1">
          <div class="truncate text-[15px] text-charcoal">{{ item.originName }}</div>
          <div class="mt-0.5 text-caption text-dim-gray">
            处理耗时：{{ formatMs(item.costTime) }}
          </div>
        </div>
        <button
          class="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-pill bg-charcoal px-4 text-caption font-medium text-parchment hover:bg-ink"
          @click="handleDownload(item)"
        >
          <z-icon :icon="Download" :size="14" aria-hidden="true" />
          下载带水印视频
        </button>
      </div>
    </section>

    <!-- 隐藏媒体渲染节点 -->
    <video ref="hiddenVideoRef" class="hidden"></video>
    <canvas ref="offCanvasRef" class="hidden"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Clapperboard, Download, TriangleAlert } from "lucide-vue-next";
import ZIcon from "@/components/z-icon/index.vue";

// ================= 配置项 =================
const DEFAULT_WATER_TEXT = "工具箱水印"; // 水印文字默认值（清空输入时回退）
const MAX_FILE_SIZE_MB = 100; // 单文件最大 MB
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
// ==========================================

// 水印文字（可自定义，默认工具箱水印）
const watermarkText = ref(DEFAULT_WATER_TEXT);

// DOM Ref
const fileInputRef = ref<HTMLInputElement | null>(null);
const hiddenVideoRef = ref<HTMLVideoElement | null>(null);
const offCanvasRef = ref<HTMLCanvasElement | null>(null);

// 状态
const processing = ref(false);
const statusTip = ref("请上传MP4视频");
const totalInfo = ref("");

interface ResultItem {
  tempId: number;
  blob: Blob;
  originName: string;
  outputName: string;
  costTime: number;
}
const resultList = ref<ResultItem[]>([]);

/** 毫秒格式化 -> XX分XX秒 */
function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, "0")}分${sec.toString().padStart(2, "0")}秒`;
}

/** 文件下载 */
function downloadBlob(blob: Blob, fileName: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

/** 单个视频加水印处理 */
async function processSingleVideo(
  file: File,
  text: string,
): Promise<Omit<ResultItem, "tempId">> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const video = hiddenVideoRef.value!;
    const canvas = offCanvasRef.value!;
    const ctx = canvas.getContext("2d")!;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: "video/mp4" });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = () => {
        const costTime = Date.now() - startTime;
        const blob = new Blob(chunks, { type: "video/mp4" });
        URL.revokeObjectURL(url);
        resolve({
          blob,
          originName: file.name,
          outputName: `water_${file.name}`,
          costTime,
        });
      };

      video.play().catch(reject);
      recorder.start();

      function renderFrame() {
        if (recorder.state !== "recording") return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // 右下角半透明白色水印（宽度自适应，长文字不溢出画布）
        ctx.fillStyle = "rgba(255,255,255,0.24)";
        ctx.font = "20px 'Microsoft YaHei', sans-serif";
        const margin = 30;
        const textWidth = ctx.measureText(text).width;
        const x = Math.max(margin, canvas.width - textWidth - margin);
        ctx.fillText(text, x, canvas.height - margin);
        requestAnimationFrame(renderFrame);
      }
      renderFrame();

      video.onended = () => {
        recorder.stop();
        video.pause();
      };
    };

    video.onerror = (err) => reject(err);
  });
}

/** 选择文件 */
async function onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  processing.value = true;
  resultList.value = [];
  totalInfo.value = "";
  statusTip.value = "";

  const fileArr = Array.from(files);
  // 先过滤超大文件
  const validFiles: File[] = [];
  const overflowNames: string[] = [];

  for (const f of fileArr) {
    if (f.size > MAX_FILE_SIZE) {
      overflowNames.push(f.name);
    } else {
      validFiles.push(f);
    }
  }

  if (overflowNames.length > 0) {
    statusTip.value = `以下文件超过${MAX_FILE_SIZE_MB}MB已跳过：${overflowNames.join("、")}`;
  }

  if (validFiles.length === 0) {
    processing.value = false;
    if (fileInputRef.value) fileInputRef.value.value = "";
    return;
  }

  const batchStart = Date.now();
  const total = validFiles.length;
  // 批量开始时定格水印文字，避免处理中途被修改
  const text = watermarkText.value.trim() || DEFAULT_WATER_TEXT;

  try {
    for (let i = 0; i < total; i++) {
      const f = validFiles[i];
      statusTip.value = `正在处理 ${i + 1}/${total}：${f.name}`;
      const res = await processSingleVideo(f, text);
      resultList.value.push({
        tempId: Date.now() + Math.random(),
        ...res,
      });
    }
    const totalCost = Date.now() - batchStart;
    statusTip.value = "全部处理完成！";
    totalInfo.value = `本次批量共${total}个视频，总处理耗时：${formatMs(totalCost)}`;
  } catch (err) {
    console.error(err);
    statusTip.value = "处理失败，仅支持短MP4，长视频不推荐此方案";
  } finally {
    processing.value = false;
    if (fileInputRef.value) fileInputRef.value.value = "";
  }
}

/** 点击下载单个视频 */
function handleDownload(item: ResultItem) {
  downloadBlob(item.blob, item.outputName);
}
</script>
