<template>
  <div class="mx-auto max-w-3xl px-6 py-12">
    <!-- 页头 -->
    <header class="mb-8 flex items-start gap-4">
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-charcoal text-parchment"
      >
        <z-icon :icon="ImageIcon" :size="20" aria-hidden="true" />
      </span>
      <div>
        <h2 class="text-heading-sm font-semibold text-charcoal">
          纯前端图片转换器
        </h2>
        <p class="mt-1 text-caption text-dim-gray">
          上传任意图片 → 选择尺寸 → 转换多种格式，全程本地运算
        </p>
      </div>
    </header>

    <!-- 上传区 -->
    <z-upload
      accept="image/*"
      :multiple="false"
      title="点击选择图片"
      subtitle="支持 PNG、JPG、WebP 等常见格式"
      @select="onFileSelect"
    />

    <!-- 预览 -->
    <img
      v-if="previewUrl"
      :src="previewUrl"
      alt="预览图"
      class="mt-6 max-h-48 rounded-img border border-linen-border object-contain"
    />

    <!-- 尺寸选择 -->
    <section class="mt-8">
      <h3 class="text-subheading font-medium text-charcoal">
        选择输出尺寸（可多选）
      </h3>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="size in SIZES"
          :key="size"
          class="cursor-pointer rounded-pill border px-3.5 py-2 text-[13px]"
          :class="
            selectedSizes.has(size)
              ? 'border-charcoal bg-charcoal font-medium text-parchment'
              : 'border-linen-border bg-parchment text-dim-gray hover:border-stone hover:text-charcoal'
          "
          @click="toggleSize(size)"
        >
          {{ size }}×{{ size }}
        </button>
      </div>
    </section>

    <!-- 操作区 -->
    <div class="mt-8 flex gap-3">
      <button
        class="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-pill bg-charcoal text-[15px] font-medium text-parchment hover:bg-ink disabled:cursor-not-allowed disabled:bg-stone disabled:text-dim-gray"
        :disabled="!currentImage || selectedSizes.size === 0 || loading"
        @click="handleConvert"
      >
        <z-icon
          v-if="loading"
          :icon="LoaderCircle"
          :size="16"
          class="animate-spin"
          aria-hidden="true"
        />
        {{ loading ? "转换中…" : "开始转换" }}
      </button>
      <button
        class="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-pill border border-linen-border bg-parchment px-6 text-[15px] font-medium text-charcoal hover:border-stone hover:bg-warm-sand disabled:cursor-not-allowed disabled:text-stone"
        :disabled="!downloadItems.length"
        @click="downloadZip"
      >
        <z-icon :icon="Archive" :size="16" aria-hidden="true" />
        批量下载
      </button>
    </div>

    <!-- 结果 -->
    <section
      v-if="showResult"
      class="mt-8 rounded-card-lg border border-linen-border bg-warm-sand p-6"
    >
      <h3
        class="flex items-center gap-2 text-subheading font-medium text-charcoal"
      >
        <z-icon
          :icon="CheckCircle2"
          :size="18"
          class="text-indigo-accent"
          aria-hidden="true"
        />
        转换完成
      </h3>

      <div class="mt-5">
        <h4 class="text-[15px] font-medium text-charcoal">PNG 格式</h4>
        <a
          v-for="item in pngItems"
          :key="item.name"
          :href="item.url"
          :download="item.name"
          class="dl-link"
        >
          {{ item.name }}
        </a>
      </div>

      <div class="mt-4">
        <h4 class="text-[15px] font-medium text-charcoal">
          ICO 格式（Windows 图标）
        </h4>
        <a
          v-for="item in icoItems"
          :key="item.name"
          :href="item.url"
          :download="item.name"
          class="dl-link"
        >
          {{ item.name }}
        </a>
      </div>

      <div class="mt-4">
        <h4 class="text-[15px] font-medium text-charcoal">
          ICNS 格式（Mac 图标）
        </h4>
        <a
          v-for="item in icnsItems"
          :key="item.name"
          :href="item.url"
          :download="item.name"
          class="dl-link"
        >
          {{ item.name }}
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from "vue";
import {
  Archive,
  CheckCircle2,
  ImageIcon,
  LoaderCircle,
} from "lucide-vue-next";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import ZIcon from "@/components/z-icon/index.vue";
import ZUpload from "@/components/z-upload/index.vue";

// 尺寸常量
const SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

// 状态
const previewUrl = ref<string>("");
const currentImage = ref<HTMLImageElement | null>(null);
const selectedSizes = reactive(new Set<number>([256]));
const loading = ref(false);
const showResult = ref(false);

/** 单个下载条目：文件名 + Blob（ZIP 用）+ Object URL（链接用） */
interface DownloadItem {
  name: string;
  blob: Blob;
  url: string;
}
const downloadItems = ref<DownloadItem[]>([]);

/** 按格式筛选下载条目 */
const pngItems = computed(() =>
  downloadItems.value.filter((i) => i.name.endsWith(".png")),
);
const icoItems = computed(() =>
  downloadItems.value.filter((i) => i.name.endsWith(".ico")),
);
const icnsItems = computed(() =>
  downloadItems.value.filter((i) => i.name.endsWith(".icns")),
);

/** 记录下载条目 */
function pushDownload(name: string, blob: Blob) {
  downloadItems.value.push({ name, blob, url: URL.createObjectURL(blob) });
}

/** 清空下载条目（并释放 Object URL） */
function clearDownloadItems() {
  downloadItems.value.forEach((i) => URL.revokeObjectURL(i.url));
  downloadItems.value = [];
}

onUnmounted(clearDownloadItems);

/** 文件选择（单选，取第一个） */
async function onFileSelect(files: File[]) {
  const file = files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  previewUrl.value = url;

  const img = new Image();
  img.src = url;
  await new Promise<void>((resolve) => (img.onload = () => resolve()));
  currentImage.value = img;
  showResult.value = false;
}

/** 切换尺寸选中 */
function toggleSize(size: number) {
  if (selectedSizes.has(size)) {
    selectedSizes.delete(size);
  } else {
    selectedSizes.add(size);
  }
}

/** 开始批量转换 */
async function handleConvert() {
  if (!currentImage.value || selectedSizes.size === 0) return;

  loading.value = true;
  clearDownloadItems();

  try {
    for (const size of selectedSizes) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(currentImage.value, 0, 0, size, size);

      // PNG
      const pngBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1),
      );
      if (pngBlob) pushDownload(`${size}x${size}.png`, pngBlob);

      // ICO
      const icoBlob = await createIcoFromCanvas(canvas, size);
      pushDownload(`${size}x${size}.ico`, icoBlob);

      // ICNS
      const icnsBlob = await createIcnsFromCanvas(canvas);
      pushDownload(`${size}x${size}.icns`, icnsBlob);
    }
    showResult.value = true;
  } finally {
    loading.value = false;
  }
}

/** 批量打包 ZIP 下载 */
async function downloadZip() {
  const zip = new JSZip();
  downloadItems.value.forEach((item) => zip.file(item.name, item.blob));
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "图标合集.zip");
}

/** 生成 ICO Blob */
function createIcoFromCanvas(
  canvas: HTMLCanvasElement,
  size: number,
): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error("Blob error");
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer;
        const pngData = new Uint8Array(buffer);
        const dataSize = pngData.length;

        const icoHeader = new Uint8Array(22);
        let pos = 0;
        icoHeader.set([0, 0], pos);
        pos += 2;
        icoHeader.set([1, 0], pos);
        pos += 2;
        icoHeader.set([1, 0], pos);
        pos += 2;
        icoHeader.set([size & 0xff], pos);
        pos += 1;
        icoHeader.set([size & 0xff], pos);
        pos += 1;
        icoHeader.set([0], pos);
        pos += 1;
        icoHeader.set([0], pos);
        pos += 1;
        icoHeader.set([1, 0], pos);
        pos += 2;
        icoHeader.set([32, 0], pos);
        pos += 2;

        new DataView(icoHeader.buffer).setUint32(pos, dataSize, true);
        pos += 4;
        new DataView(icoHeader.buffer).setUint32(pos, 22, true);

        const total = new Uint8Array(icoHeader.length + dataSize);
        total.set(icoHeader, 0);
        total.set(pngData, 22);

        resolve(new Blob([total], { type: "image/x-icon" }));
      };
      reader.readAsArrayBuffer(blob);
    });
  });
}

/** 生成 ICNS Blob */
function createIcnsFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error("Blob error");
      const reader = new FileReader();
      reader.onload = () => {
        const png = new Uint8Array(reader.result as ArrayBuffer);
        const header = new Uint8Array([0x69, 0x63, 0x6e, 0x73]);
        const fullSize = png.length + 16;
        const sizeBuf = new Uint8Array(4);
        new DataView(sizeBuf.buffer).setUint32(0, fullSize, false);

        const type = new Uint8Array([0x69, 0x32, 0x35, 0x36]);
        const entrySizeBuf = new Uint8Array(4);
        new DataView(entrySizeBuf.buffer).setUint32(0, png.length + 8, false);

        const icns = new Uint8Array(16 + png.length);
        icns.set(header, 0);
        icns.set(sizeBuf, 4);
        icns.set(type, 8);
        icns.set(entrySizeBuf, 12);
        icns.set(png, 16);

        resolve(new Blob([icns], { type: "image/icns" }));
      };
      reader.readAsArrayBuffer(blob);
    });
  });
}
</script>

<style lang="scss" scoped>
/* 下载链接（Vue 渲染，自带 scope 属性） */
.dl-link {
  display: block;
  padding: 8px 0;
  color: var(--color-indigo-accent);
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: -0.35px;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
