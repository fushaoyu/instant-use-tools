<template>
  <div class="mx-auto max-w-3xl px-6 py-12">
    <!--页面头部 -->
    <div class="flex items-start gap-4 mb-10">
      <div
        class="flex h-11 w-11 items-center justify-center rounded-card bg-charcoal text-parchment"
      >
        <z-icon :icon="CommandIcon" :size="22" />
      </div>
      <div>
        <h1 class="text-heading-sm font-[480] text-charcoal">图片体积压缩</h1>
        <p class="mt-1 text-caption text-dim-gray">
          本地浏览器运算；可保持原图像素尺寸减小文件体积，也可缩放+压缩
        </p>
      </div>
    </div>

    <!--上传区域 -->
    <z-upload
      accept="image/*"
      multiple
      title="点击或拖拽图片上传，支持多张"
      :subtitle="`单图最大 ${MAX_FILE_MB}MB`"
      :max-size-mb="MAX_FILE_MB"
      @select="handleInputFiles"
    />

    <!--设置面板 -->
    <div
      class="rounded-card-lg border border-linen-border bg-parchment p-6 sm:p-7 shadow-subtle-2 my-6"
    >
      <h3 class="text-subheading font-[480] text-charcoal mb-4">压缩参数</h3>

      <div class="flex flex-wrap gap-4 items-center mb-4">
        <label
          class="flex items-center gap-2 text-body text-charcoal cursor-pointer"
        >
          <input v-model="enableScale" type="checkbox" />
          启用缩放（关闭则保持原图像素尺寸，仅压缩体积）
        </label>
      </div>

      <div v-if="enableScale" class="mb-4">
        <label class="block text-caption text-dim-gray mb-1"
          >缩放比例 {{ scalePercent }} %</label
        >
        <input
          v-model.number="scalePercent"
          type="range"
          min="10"
          max="100"
          class="w-full"
        />
      </div>

      <div class="flex flex-wrap gap-4 items-end mb-4">
        <div>
          <label class="block text-caption text-dim-gray mb-1">输出格式</label>
          <select
            v-model="outputMime"
            class="h-10 rounded-input border border-linen-border bg-parchment px-3 text-[15px] focus:border-indigo-accent focus:outline-none"
          >
            <option value="image/jpeg">JPEG（有损DCT顺序编码）</option>
            <option value="image/png">PNG（Deflate LZ77+Huffman）</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>
        <div>
          <label class="block text-caption text-dim-gray mb-1"
            >压缩质量 {{ qualityValue }} %</label
          >
          <input
            v-model.number="qualityValue"
            type="range"
            min="10"
            max="100"
            class="w-36"
          />
        </div>
        <button
          class="h-11 rounded-pill bg-charcoal px-6 text-[15px] font-medium text-parchment hover:bg-ink disabled:cursor-not-allowed disabled:bg-stone disabled:text-dim-gray hover:cursor-pointer"
          :disabled="processing || sourceList.length === 0"
          @click="handleCompressAll"
        >
          {{ processing ? "压缩中…" : "开始压缩图片" }}
        </button>
      </div>

      <!--技术说明提示框 -->
      <div
        class="flex items-start gap-1.5 text-caption text-indigo-accent mt-4"
      >
        <z-icon :icon="TriangleAlert" :size="14" class="mt-0.5 shrink-0" />
        <div>
          <p class="mb-1">浏览器Canvas.toBlob限制说明：</p>
          <p>
            JPEG仅输出<strong>DCT顺序编码</strong>；浏览器API<strong>不支持累进编码、分层编码、DPCM无损JPEG</strong>。
          </p>
          <p>
            PNG输出：浏览器内部完成 Prediction预处理 +
            Deflate(LZ77+Huffman)，JS层无法干预预处理阶段。
          </p>
        </div>
      </div>

      <div
        v-if="warnText"
        class="flex items-center gap-1.5 text-caption text-indigo-accent mt-3"
      >
        <z-icon :icon="TriangleAlert" :size="14" />
        <span>{{ warnText }}</span>
      </div>
    </div>

    <!--已上传原图列表 -->
    <div v-if="sourceList.length">
      <h3 class="text-subheading font-[480] text-charcoal mb-3">
        已上传原图（{{ sourceList.length }}张）
      </h3>
      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 mb-8"
      >
        <div
          v-for="item in sourceList"
          :key="item.uid"
          class="rounded-card border border-linen-border bg-parchment p-3"
        >
          <img
            :src="item.objUrl"
            alt=""
            class="w-full h-30 object-contain bg-warm-sand rounded-img"
          />
          <div class="mt-2 text-caption text-dim-gray break-all">
            {{ item.name }}
          </div>
          <div class="text-[12px] text-dim-gray">
            原始：{{ formatFileSize(item.file.size) }}
          </div>
        </div>
      </div>
    </div>

    <!--压缩结果面板 -->
    <div v-if="compressResultList.length">
      <div
        class="rounded-card-lg border border-linen-border bg-warm-sand p-6 shadow-subtle-2"
      >
        <h3 class="text-subheading font-[480] text-charcoal mb-4">
          压缩结果预览
        </h3>
        <div
          class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 mb-6"
        >
          <div
            v-for="item in compressResultList"
            :key="item.uid"
            class="rounded-card border border-linen-border bg-parchment p-3"
          >
            <img
              :src="item.objUrl"
              alt="压缩后"
              class="w-full h-30 object-contain bg-warm-sand rounded-img"
            />
            <div class="mt-2 text-caption text-charcoal">
              {{ item.outputName }}
            </div>
            <div class="text-[12px] text-dim-gray">
              原始:{{ formatFileSize(item.origSize) }} → 压缩后:{{
                formatFileSize(item.compressedBlob.size)
              }}
            </div>
            <div class="text-[12px] text-indigo-accent">
              压缩率：{{ item.rate }}%
            </div>
            <button
              class="w-full mt-1.5 h-8 rounded-pill border border-linen-border bg-parchment text-[12px] text-charcoal hover:bg-warm-sand hover:cursor-pointer"
              @click="downloadSingle(item)"
            >
              下载
            </button>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-linen-border">
          <button
            class="h-11 rounded-pill bg-charcoal px-6 text-[15px] font-medium text-parchment hover:bg-ink hover:cursor-pointer"
            @click="downloadAllZip"
          >
            全部打包ZIP下载
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { TriangleAlert, CommandIcon } from "lucide-vue-next";
import ZIcon from "@/components/z-icon/index.vue";
import ZUpload from "@/components/z-upload/index.vue";

//常量
const MAX_FILE_MB = 50;

interface SourceItem {
  uid: number;
  name: string;
  file: File;
  objUrl: string;
}

interface CompressResultItem {
  uid: number;
  outputName: string;
  origSize: number;
  compressedBlob: Blob;
  objUrl: string;
  rate: string;
}

const processing = ref(false);
const warnText = ref("");

//参数
const enableScale = ref(false);
const scalePercent = ref(80);
const outputMime = ref<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");
const qualityValue = ref(80);

const sourceList = ref<SourceItem[]>([]);
const compressResultList = ref<CompressResultItem[]>([]);
const revokeUrls: string[] = [];

/**格式化字节大小 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

/**接收 z-upload 过滤后的文件，生成预览 url */
function handleInputFiles(files: File[]) {
  for (const file of files) {
    const objUrl = URL.createObjectURL(file);
    revokeUrls.push(objUrl);
    sourceList.value.push({
      uid: Date.now() + Math.random(),
      name: file.name,
      file,
      objUrl,
    });
  }
}

/**单张图片压缩；enableScale=false保持原图像素宽高 */
async function compressImage(
  file: File,
  scalePct: number,
  enableScaling: boolean,
  mime: string,
  quality: number,
): Promise<{ blob: Blob; origSize: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    revokeUrls.push(url);
    img.src = url;
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (enableScaling) {
        w = Math.round((img.width * scalePct) / 100);
        h = Math.round((img.height * scalePct) / 100);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error("生成blob失败"));
            return;
          }
          resolve({ blob, origSize: file.size });
        },
        mime,
        quality / 100,
      );
    };
    img.onerror = reject;
  });
}

/**批量压缩全部 */
async function handleCompressAll() {
  processing.value = true;
  warnText.value = "";
  compressResultList.value = [];
  try {
    for (const sourceItem of sourceList.value) {
      const res = await compressImage(
        sourceItem.file,
        scalePercent.value,
        enableScale.value,
        outputMime.value,
        qualityValue.value,
      );
      const objUrl = URL.createObjectURL(res.blob);
      revokeUrls.push(objUrl);

      //修改文件后缀
      let outputName = sourceItem.name;
      if (outputMime.value === "image/jpeg")
        outputName = outputName.replace(/\.\w+$/, ".jpg");
      else if (outputMime.value === "image/webp")
        outputName = outputName.replace(/\.\w+$/, ".webp");
      else if (outputMime.value === "image/png")
        outputName = outputName.replace(/\.\w+$/, ".png");

      const reduceRate =
        res.origSize === 0
          ? "0"
          : ((1 - res.blob.size / res.origSize) * 100).toFixed(1);
      compressResultList.value.push({
        uid: Date.now() + Math.random(),
        outputName,
        origSize: res.origSize,
        compressedBlob: res.blob,
        objUrl,
        rate: reduceRate,
      });
    }
  } catch (err) {
    console.error(err);
    warnText.value = "图片压缩发生错误";
  } finally {
    processing.value = false;
  }
}

/**单张下载 */
function downloadSingle(item: CompressResultItem) {
  saveAs(item.compressedBlob, item.outputName);
}

/**全部打包zip */
async function downloadAllZip() {
  const zip = new JSZip();
  compressResultList.value.forEach((i) => {
    zip.file(i.outputName, i.compressedBlob);
  });
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "compressed-images.zip");
}

onUnmounted(() => {
  revokeUrls.forEach((u) => URL.revokeObjectURL(u));
});
</script>
