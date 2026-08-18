<template>
  <div class="mx-auto max-w-3xl px-6 py-12">
    <!-- 页面头部 -->
    <div class="flex items-start gap-4 mb-10">
      <div
        class="flex h-11 w-11 items-center justify-center rounded-card bg-charcoal text-parchment"
      >
        <z-icon :icon="Code" :size="22" />
      </div>
      <div>
        <h1 class="text-heading-sm font-[480] text-charcoal">
          图片 ↔ Base64 互转
        </h1>
        <p class="mt-1 text-caption text-dim-gray">
          本地浏览器运算，将图片编码为Base64字符串，也可把Base64还原成图片
        </p>
      </div>
    </div>

    <!-- Tab切换：图片转Base64 / Base64转图片 -->
    <div class="flex gap-2 mb-8">
      <button
        @click="mode = 'toBase64'"
        class="h-11 rounded-pill border px-6 text-[15px] font-medium transition-all hover:cursor-pointer"
        :class="[
          mode === 'toBase64'
            ? 'border-charcoal bg-charcoal text-parchment'
            : 'border-linen-border bg-parchment text-charcoal hover:border-stone hover:bg-warm-sand',
        ]"
      >
        图片 → Base64
      </button>
      <button
        @click="mode = 'toImage'"
        class="h-11 rounded-pill border px-6 text-[15px] font-medium transition-all hover:cursor-pointer"
        :class="[
          mode === 'toImage'
            ? 'border-charcoal bg-charcoal text-parchment'
            : 'border-linen-border bg-parchment text-charcoal hover:border-stone hover:bg-warm-sand',
        ]"
      >
        Base64 → 图片
      </button>
    </div>

    <!-- 模式A：图片转 Base64 -->
    <div v-if="mode === 'toBase64'">
      <!-- 上传区域 -->
      <div
        class="border-2 border-dashed border-linen-border bg-warm-sand rounded-card-lg p-8 mb-6 text-center cursor-pointer"
        :class="{ 'bg-stone/20': dragOver }"
        @click="triggerFileInput"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="onDropFiles"
      >
        <z-icon :icon="ImageUp" :size="36" class="mx-auto mb-3 text-charcoal" />
        <p class="text-body text-charcoal">点击或拖拽图片到此处上传</p>
        <p class="mt-1 text-caption text-dim-gray">
          支持多张，单图最大 {{ MAX_FILE_MB }}MB
        </p>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="onFileSelected"
        />
      </div>

      <!-- 警告提示 -->
      <div
        v-if="warningText"
        class="flex items-center gap-1.5 text-caption text-indigo-accent mb-4"
      >
        <z-icon :icon="TriangleAlert" :size="14" />
        <span>{{ warningText }}</span>
      </div>

      <!-- 结果面板 -->
      <div
        v-if="resultBase64List.length"
        class="rounded-card-lg border border-linen-border bg-warm-sand p-6 shadow-subtle-2"
      >
        <h3 class="text-subheading font-[480] text-charcoal mb-4">
          转换结果（{{ resultBase64List.length }}个）
        </h3>
        <div class="space-y-5">
          <div
            v-for="item in resultBase64List"
            :key="item.uid"
            class="bg-parchment rounded-card p-4 border border-linen-border"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-body font-medium text-charcoal">{{
                item.name
              }}</span>
              <div class="flex gap-2">
                <button
                  @click="copyBase64(item.dataUrl)"
                  class="h-10 rounded-pill border border-linen-border bg-parchment px-3 text-caption text-charcoal hover:bg-warm-sand flex items-center gap-1 hover:cursor-pointer"
                >
                  <z-icon :icon="Copy" :size="14" />
                  复制
                </button>
                <button
                  @click="downloadTxt(item)"
                  class="h-10 rounded-pill bg-charcoal px-3 text-caption text-parchment hover:bg-ink flex items-center gap-1 hover:cursor-pointer"
                >
                  <z-icon :icon="Download" :size="14" />
                  下载txt
                </button>
              </div>
            </div>
            <textarea
              readonly
              class="w-full h-28 rounded-input border border-linen-border bg-parchment px-3 py-2 text-caption text-dim-gray overflow-auto"
              >{{ item.dataUrl }}</textarea
            >
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-linen-border">
          <button
            @click="downloadAllTxt"
            class="h-11 rounded-pill bg-charcoal px-6 text-[15px] font-medium text-parchment hover:bg-ink"
          >
            全部打包下载 TXT（ZIP）
          </button>
        </div>
      </div>
    </div>

    <!-- 模式B：Base64 转图片 -->
    <div v-if="mode === 'toImage'">
      <div
        class="rounded-card-lg border border-linen-border bg-parchment p-6 shadow-subtle-2 mb-6"
      >
        <label class="block text-body font-medium text-charcoal mb-2"
          >粘贴 Base64（data:image/xxx;base64,……）</label
        >
        <textarea
          v-model="base64Input"
          class="w-full h-36 rounded-input border border-linen-border bg-parchment px-3 py-2 text-[15px] text-charcoal placeholder:text-dim-gray/70 focus:border-indigo-accent focus:outline-none"
          placeholder="粘贴完整的 data:image/png;base64,xxxx 字符串"
          @input="tryParseBase64"
        />
        <div
          v-if="parseWarning"
          class="flex items-center gap-1.5 text-caption text-indigo-accent mt-3"
        >
          <z-icon :icon="TriangleAlert" :size="14" />
          <span>{{ parseWarning }}</span>
        </div>
      </div>

      <!-- 解析成功预览 -->
      <div
        v-if="previewImageBlob"
        class="rounded-card-lg border border-linen-border bg-warm-sand p-6 shadow-subtle-2"
      >
        <h3 class="text-subheading font-[480] text-charcoal mb-3">预览图片</h3>
        <img
          :src="previewObjectUrl"
          alt="base64预览"
          class="max-w-full rounded-img mb-4"
        />
        <div class="flex gap-3">
          <button
            @click="saveDecodedImage"
            class="h-11 rounded-pill bg-charcoal px-6 text-[15px] font-medium text-parchment hover:bg-ink hover:cursor-pointer"
          >
            <z-icon :icon="Download" :size="16" class="inline mr-1" />
            下载还原图片
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
import { Code, ImageUp, TriangleAlert, Copy, Download } from "lucide-vue-next";
import ZIcon from "@/components/z-icon/index.vue";

// ========== 常量配置 ==========
const MAX_FILE_MB = 50;
const MAX_FILE_BYTE = MAX_FILE_MB * 1024 * 1024;

type WorkMode = "toBase64" | "toImage";
const mode = ref<WorkMode>("toBase64");

// -------- 图片转Base64 状态 --------
const fileInputRef = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);
const warningText = ref("");

interface Base64ResultItem {
  uid: number;
  name: string;
  dataUrl: string;
}
const resultBase64List = ref<Base64ResultItem[]>([]);
const revokeUrls: string[] = [];

// -------- Base64转图片 状态 --------
const base64Input = ref("");
const parseWarning = ref("");
const previewImageBlob = ref<Blob | null>(null);
const previewObjectUrl = ref("");

/** 触发文件选择弹窗 */
function triggerFileInput() {
  fileInputRef.value?.click();
}

/** 拖拽上传 */
function onDropFiles(e: DragEvent) {
  dragOver.value = false;
  const files = Array.from(e.dataTransfer!.files).filter((f) =>
    f.type.startsWith("image/"),
  );
  handleImageFiles(files);
}

/** input选择文件 */
function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;
  handleImageFiles(Array.from(target.files));
}

/** 处理图片文件列表，转为dataURL(base64) */
async function handleImageFiles(files: File[]) {
  warningText.value = "";
  const overflowNames: string[] = [];
  const validFiles: File[] = [];

  for (const f of files) {
    if (f.size > MAX_FILE_BYTE) {
      overflowNames.push(f.name);
    } else {
      validFiles.push(f);
    }
  }
  if (overflowNames.length) {
    warningText.value = `跳过超过${MAX_FILE_MB}MB：${overflowNames.join("、")}`;
  }
  if (!validFiles.length) return;

  for (const file of validFiles) {
    const dataUrl = await fileToBase64(file);
    resultBase64List.value.push({
      uid: Date.now() + Math.random(),
      name: file.name,
      dataUrl,
    });
  }
}

/** File → base64 dataURL */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** 复制文本到剪贴板 */
async function copyBase64(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert("已复制到剪贴板");
  } catch {
    // 剪贴板失败静默
  }
}

/** 单个结果下载txt */
function downloadTxt(item: Base64ResultItem) {
  const blob = new Blob([item.dataUrl], { type: "text/plain;charset=utf‑8" });
  saveAs(blob, `${item.name}.txt`);
}

/** 全部打包为ZIP，每个图片对应一个txt */
async function downloadAllTxt() {
  const zip = new JSZip();
  for (const item of resultBase64List.value) {
    zip.file(`${item.name}.txt`, item.dataUrl);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "base64‑images.zip");
}

/** 尝试解析输入框的base64 data‑url */
function tryParseBase64() {
  parseWarning.value = "";
  previewImageBlob.value = null;
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
    previewObjectUrl.value = "";
  }

  const raw = base64Input.value.trim();
  if (!raw) return;

  if (!raw.startsWith("data:image/")) {
    parseWarning.value = "需要完整data‑url，以 data:image/ 开头";
    return;
  }

  const commaIdx = raw.indexOf(",");
  if (commaIdx === -1) {
    parseWarning.value = "base64格式错误，找不到逗号分隔符";
    return;
  }

  try {
    const binary = atob(raw.slice(commaIdx + 1));
    const bytes = Uint8Array.from([...binary].map((c) => c.charCodeAt(0)));
    const blob = new Blob([bytes], { type: raw.slice(5, commaIdx) });
    previewImageBlob.value = blob;
    previewObjectUrl.value = URL.createObjectURL(blob);
    revokeUrls.push(previewObjectUrl.value);
  } catch (err) {
    parseWarning.value = "base64解码失败，字符串损坏";
  }
}

/** 保存还原后的图片 */
function saveDecodedImage() {
  if (!previewImageBlob.value) return;
  saveAs(previewImageBlob.value, "decoded‑image.png");
}

/** 组件销毁：释放所有ObjectURL，防止内存泄漏 */
onUnmounted(() => {
  revokeUrls.forEach((u) => URL.revokeObjectURL(u));
});
</script>
