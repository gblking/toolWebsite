<template>
  <div class="page-image-compression">
    <el-card shadow="never" class="compression-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Image Compression Studio</span>
        <h1>图片压缩与格式转换</h1>
        <p>
          基于 Element Plus 与 browser-image-compression
          实现，支持上传后多次调参重压，直接对比压缩前后预览与体积变化。
        </p>
      </div>

      <div class="hero-tags">
        <el-tag type="primary">JPEG</el-tag>
        <el-tag type="success">PNG</el-tag>
        <el-tag type="warning">WEBP</el-tag>
        <el-tag>BMP</el-tag>
      </div>
    </el-card>

    <el-card shadow="never" class="workbench-card">
      <template #header>
        <div class="card-header">
          <div>
            <h2>压缩工作台</h2>
          </div>
          <el-tag type="info" effect="light">
            {{ sourceFile ? "已载入原图" : "等待上传" }}
          </el-tag>
        </div>
      </template>

      <div class="workbench-layout">
        <div class="workbench-main">
          <div class="workbench-column">
            <el-upload
              drag
              :auto-upload="false"
              :show-file-list="false"
              :disabled="isCompressing"
              accept=".jpg,.jpeg,.png,.webp,.bmp,image/jpeg,image/png,image/webp,image/bmp"
              class="upload-panel"
              @change="handleFileChange"
            >
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="el-upload__text">拖拽图片到此处，或 <em>点击上传</em></div>
              <template #tip>
                <div class="upload-tip">
                  支持 `jpeg / png / webp / bmp`，上传后可转换为任意目标格式下载。
                </div>
              </template>
            </el-upload>

            <div class="source-summary">
              <div class="summary-item">
                <span>原图格式</span>
                <strong>{{ sourceMeta?.formatLabel ?? "--" }}</strong>
              </div>
              <div class="summary-item">
                <span>原图大小</span>
                <strong>{{ sourceMeta ? formatBytes(sourceMeta.size) : "--" }}</strong>
              </div>
              <div class="summary-item">
                <span>分辨率</span>
                <strong>{{ sourceMeta?.dimensions ?? "--" }}</strong>
              </div>
            </div>
          </div>

          <div class="workbench-column workbench-column--compact">
            <el-form label-position="top" class="compression-form">
              <div class="config-grid">
                <el-form-item label="输出格式">
                  <el-select
                    v-model="form.outputFormat"
                    placeholder="请选择输出格式"
                  >
                    <el-option
                      v-for="item in formatOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="输出文件名">
                  <el-input :model-value="outputFileName" readonly />
                </el-form-item>
              </div>

              <el-form-item label="压缩质量">
                <div class="quality-panel">
                  <div class="quality-header">
                    <div>
                      <strong>{{ form.quality }}%</strong>
                      <span>点击进度条快速调整，按钮可做细调</span>
                    </div>
                    <el-tag type="primary" effect="light">
                      {{ qualityTone }}
                    </el-tag>
                  </div>

                  <div
                    class="quality-progress"
                    role="slider"
                    aria-label="压缩质量"
                    aria-valuemin="1"
                    aria-valuemax="100"
                    :aria-valuenow="form.quality"
                    tabindex="0"
                    @click="handleQualityTrackClick"
                    @keydown.left.prevent="adjustQuality(-5)"
                    @keydown.right.prevent="adjustQuality(5)"
                  >
                    <el-progress
                      :percentage="form.quality"
                      :stroke-width="10"
                      :show-text="false"
                    />
                  </div>

                  <div class="quality-actions">
                    <el-button @click="adjustQuality(-10)">-10%</el-button>
                    <el-button @click="adjustQuality(-5)">-5%</el-button>
                    <el-button @click="adjustQuality(5)">+5%</el-button>
                    <el-button @click="adjustQuality(10)">+10%</el-button>
                  </div>

                  <p class="field-tip">
                    PNG/BMP 对质量参数不如 JPEG/WEBP 敏感，更多体积变化通常来自格式转换。
                  </p>
                </div>
              </el-form-item>
            </el-form>

            <div class="action-rail">
              <el-button
                type="primary"
                :loading="isCompressing"
                :disabled="!sourceFile"
                @click="handleCompress"
              >
                {{ compressedFile ? "重新压缩" : "开始压缩" }}
              </el-button>
              <el-button
                type="success"
                :disabled="!compressedFile || isCompressing"
                @click="handleDownload"
              >
                下载图片
              </el-button>
              <el-button :disabled="!sourceFile || isCompressing" @click="handleReset">
                清空
              </el-button>
            </div>

            <div v-if="isCompressing" class="process-panel">
              <div class="process-header">
                <span>处理进度</span>
                <strong>{{ compressionProgress }}%</strong>
              </div>
              <el-progress :percentage="compressionProgress" :stroke-width="14" />
            </div>
          </div>
        </div>

        <div
          v-if="compressedMeta && sourceMeta"
          class="comparison-banner workbench-summary"
        >
          <div>
            <span>压缩前体积</span>
            <strong>{{ formatBytes(sourceMeta.size) }}</strong>
          </div>
          <div>
            <span>压缩后体积</span>
            <strong>{{ formatBytes(compressedMeta.size) }}</strong>
          </div>
          <div>
            <span>体积变化</span>
            <strong>{{ sizeDeltaText }}</strong>
          </div>
          <div>
            <span>压缩比例</span>
            <strong>{{ reductionRateText }}</strong>
          </div>
        </div>
      </div>
    </el-card>

    <div class="preview-grid">
      <el-card shadow="never" class="preview-card">
        <template #header>
          <div class="card-header">
            <div>
              <h2>原图预览</h2>
              <p>{{ sourceMeta ? sourceMeta.name : "上传后展示原图信息" }}</p>
            </div>
            <el-tag v-if="sourceMeta" type="info" effect="light">
              {{ sourceMeta.formatLabel }}
            </el-tag>
          </div>
        </template>

        <div v-if="sourcePreviewUrl" class="preview-stage">
          <img :src="sourcePreviewUrl" alt="原图预览" />
        </div>
        <el-empty v-else description="请先上传图片" />

        <div v-if="sourceMeta" class="stats-grid">
          <div class="stat-item">
            <span>图片大小</span>
            <strong>{{ formatBytes(sourceMeta.size) }}</strong>
          </div>
          <div class="stat-item">
            <span>尺寸</span>
            <strong>{{ sourceMeta.dimensions }}</strong>
          </div>
          <div class="stat-item">
            <span>格式</span>
            <strong>{{ sourceMeta.formatLabel }}</strong>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="preview-card result-card">
        <template #header>
          <div class="card-header">
            <div>
              <h2>压缩结果</h2>
              <p>
                {{
                  compressedMeta
                    ? "已保留原图，可继续改参数后重新压缩。"
                    : "压缩完成后这里会展示新图片与体积变化。"
                }}
              </p>
            </div>
            <el-tag
              :type="compressedMeta ? 'success' : 'warning'"
              effect="light"
            >
              {{ compressedMeta ? "已生成" : "未生成" }}
            </el-tag>
          </div>
        </template>

        <div v-if="compressedPreviewUrl" class="preview-stage">
          <img :src="compressedPreviewUrl" alt="压缩后预览" />
        </div>
        <el-empty v-else description="压缩后预览暂未生成" />

        <div v-if="compressedMeta" class="stats-grid">
          <div class="stat-item">
            <span>压缩后大小</span>
            <strong>{{ formatBytes(compressedMeta.size) }}</strong>
          </div>
          <div class="stat-item">
            <span>尺寸</span>
            <strong>{{ compressedMeta.dimensions }}</strong>
          </div>
          <div class="stat-item">
            <span>输出格式</span>
            <strong>{{ compressedMeta.formatLabel }}</strong>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { UploadFile } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import imageCompression from "browser-image-compression";

type SupportedMime = "image/jpeg" | "image/png" | "image/webp" | "image/bmp";

interface FormatOption {
  label: string;
  value: SupportedMime;
  extension: string;
}

interface ImageMeta {
  name: string;
  size: number;
  width: number;
  height: number;
  dimensions: string;
  format: SupportedMime;
  formatLabel: string;
}

interface CompressionModule {
  (
    file: File,
    options: {
      maxSizeMB: number;
      useWebWorker: boolean;
      fileType: SupportedMime;
      initialQuality: number;
      alwaysKeepResolution: boolean;
      maxIteration?: number;
      onProgress?: (progress: number) => void;
    },
  ): Promise<File>;
  drawFileInCanvas: (
    file: File,
  ) => Promise<[ImageBitmap | HTMLImageElement, HTMLCanvasElement | OffscreenCanvas]>;
  canvasToFile: (
    canvas: HTMLCanvasElement | OffscreenCanvas,
    fileType: SupportedMime,
    fileName: string,
    fileLastModified: number,
    quality?: number,
  ) => Promise<File>;
}

const compressionModule = imageCompression as unknown as CompressionModule;

const formatOptions: FormatOption[] = [
  { label: "JPEG", value: "image/jpeg", extension: "jpg" },
  { label: "PNG", value: "image/png", extension: "png" },
  { label: "WEBP", value: "image/webp", extension: "webp" },
  { label: "BMP", value: "image/bmp", extension: "bmp" },
];

const supportedInputTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/x-ms-bmp",
]);

const form = reactive({
  outputFormat: "image/jpeg" as SupportedMime,
  quality: 80,
});

const sourceFile = ref<File | null>(null);
const sourceMeta = ref<ImageMeta | null>(null);
const sourcePreviewUrl = ref("");
const compressedFile = ref<File | null>(null);
const compressedMeta = ref<ImageMeta | null>(null);
const compressedPreviewUrl = ref("");
const isCompressing = ref(false);
const compressionProgress = ref(0);

const outputFileName = computed(() => {
  if (!sourceFile.value) {
    return "";
  }
  return buildOutputName(sourceFile.value.name, form.outputFormat);
});

const qualityTone = computed(() => {
  if (form.quality >= 85) {
    return "高保真";
  }
  if (form.quality >= 60) {
    return "均衡";
  }
  return "高压缩";
});

const sizeDeltaText = computed(() => {
  if (!sourceMeta.value || !compressedMeta.value) {
    return "--";
  }

  const delta = compressedMeta.value.size - sourceMeta.value.size;
  const sign = delta <= 0 ? "-" : "+";
  return `${sign}${formatBytes(Math.abs(delta))}`;
});

const reductionRateText = computed(() => {
  if (!sourceMeta.value || !compressedMeta.value) {
    return "--";
  }

  const ratio =
    ((sourceMeta.value.size - compressedMeta.value.size) /
      sourceMeta.value.size) *
    100;
  return `${ratio >= 0 ? ratio.toFixed(1) : `+${Math.abs(ratio).toFixed(1)}`}%`;
});

function normalizeMimeType(file: File): SupportedMime | null {
  const lowerName = file.name.toLowerCase();

  if (file.type === "image/x-ms-bmp") {
    return "image/bmp";
  }

  if (formatOptions.some((item) => item.value === file.type)) {
    return file.type as SupportedMime;
  }

  if (/\.(jpg|jpeg)$/.test(lowerName)) {
    return "image/jpeg";
  }
  if (/\.png$/.test(lowerName)) {
    return "image/png";
  }
  if (/\.webp$/.test(lowerName)) {
    return "image/webp";
  }
  if (/\.bmp$/.test(lowerName)) {
    return "image/bmp";
  }

  return null;
}

function getFormatLabel(format: SupportedMime) {
  return formatOptions.find((item) => item.value === format)?.label ?? format;
}

function buildOutputName(fileName: string, mimeType: SupportedMime) {
  const option = formatOptions.find((item) => item.value === mimeType);
  const extension = option?.extension ?? "jpg";
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return `${baseName}.${extension}`;
}

function clampQuality(value: number) {
  return Math.min(100, Math.max(1, value));
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

async function readImageMeta(file: File, format: SupportedMime) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          resolve({
            width: image.naturalWidth,
            height: image.naturalHeight,
          });
        };
        image.onerror = () => reject(new Error("图片解析失败"));
        image.src = objectUrl;
      },
    );

    return {
      name: file.name,
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
      dimensions: `${dimensions.width} × ${dimensions.height}`,
      format,
      formatLabel: getFormatLabel(format),
    } satisfies ImageMeta;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function updatePreviewUrl(target: "source" | "compressed", file: File | null) {
  const nextUrl = file ? URL.createObjectURL(file) : "";

  if (target === "source") {
    if (sourcePreviewUrl.value) {
      URL.revokeObjectURL(sourcePreviewUrl.value);
    }
    sourcePreviewUrl.value = nextUrl;
    return;
  }

  if (compressedPreviewUrl.value) {
    URL.revokeObjectURL(compressedPreviewUrl.value);
  }
  compressedPreviewUrl.value = nextUrl;
}

function resetCompressedState() {
  compressedFile.value = null;
  compressedMeta.value = null;
  compressionProgress.value = 0;
  updatePreviewUrl("compressed", null);
}

async function setSourceFile(file: File) {
  const normalizedType = normalizeMimeType(file);

  if (!normalizedType) {
    throw new Error("仅支持 jpeg、png、webp、bmp 图片。");
  }

  sourceFile.value = file;
  sourceMeta.value = await readImageMeta(file, normalizedType);
  form.outputFormat = normalizedType;
  updatePreviewUrl("source", file);
  resetCompressedState();
}

async function handleFileChange(uploadFile: UploadFile) {
  const rawFile = uploadFile.raw as File | undefined;

  if (!rawFile) {
    ElMessage.error("读取上传文件失败");
    return;
  }

  if (!supportedInputTypes.has(rawFile.type) && !normalizeMimeType(rawFile)) {
    ElMessage.error("仅支持 jpeg、png、webp、bmp 图片");
    return;
  }

  try {
    await setSourceFile(rawFile);
    ElMessage.success("图片已载入，可以开始压缩");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "图片载入失败");
  }
}

function adjustQuality(offset: number) {
  form.quality = clampQuality(form.quality + offset);
}

function handleQualityTrackClick(event: MouseEvent) {
  const target = event.currentTarget as HTMLDivElement;
  const { left, width } = target.getBoundingClientRect();
  const next = Math.round((((event.clientX - left) / width) * 100) / 5) * 5;
  form.quality = clampQuality(next);
}

async function convertWithCanvas(file: File, mimeType: SupportedMime) {
  const outputName = buildOutputName(file.name, mimeType);
  const quality = form.quality / 100;
  const [imageLike, canvas] = await compressionModule.drawFileInCanvas(file);

  if ("close" in imageLike && typeof imageLike.close === "function") {
    imageLike.close();
  }

  return compressionModule.canvasToFile(
    canvas,
    mimeType,
    outputName,
    Date.now(),
    quality,
  );
}

function renameFile(file: File, mimeType: SupportedMime) {
  return new File([file], buildOutputName(file.name, mimeType), {
    type: mimeType,
    lastModified: Date.now(),
  });
}

function isSameFormatOutput() {
  return sourceMeta.value?.format === form.outputFormat;
}

async function handleCompress() {
  if (!sourceFile.value) {
    ElMessage.warning("请先上传图片");
    return;
  }

  isCompressing.value = true;
  compressionProgress.value = 0;

  try {
    const quality = form.quality / 100;
    const originalSizeMB = sourceFile.value.size / 1024 / 1024;
    const targetSizeMB = Math.max(originalSizeMB * Math.max(quality, 0.15), 0.05);
    const sameFormatOutput = isSameFormatOutput();
    const preferResize =
      form.outputFormat === "image/png" || form.outputFormat === "image/bmp";

    let nextFile: File;

    try {
      nextFile = await compressionModule(sourceFile.value, {
        maxSizeMB: targetSizeMB,
        useWebWorker: true,
        fileType: form.outputFormat,
        initialQuality: quality,
        alwaysKeepResolution: !preferResize,
        maxIteration: 20,
        onProgress: (progress) => {
          compressionProgress.value = clampQuality(Math.round(progress));
        },
      });
    } catch {
      if (sameFormatOutput) {
        nextFile = sourceFile.value;
      } else {
        compressionProgress.value = 35;
        nextFile = await convertWithCanvas(sourceFile.value, form.outputFormat);
        compressionProgress.value = 100;
      }
    }

    if (sameFormatOutput && nextFile.size >= sourceFile.value.size) {
      nextFile = sourceFile.value;
    }

    const normalizedFile = renameFile(nextFile, form.outputFormat);
    compressedFile.value = normalizedFile;
    compressedMeta.value = await readImageMeta(normalizedFile, form.outputFormat);
    updatePreviewUrl("compressed", normalizedFile);
    compressionProgress.value = 100;

    if (sameFormatOutput && normalizedFile.size === sourceFile.value.size) {
      ElMessage.warning("当前参数下同格式压缩没有带来更小体积，已保留原图结果");
    } else {
      ElMessage.success("压缩完成，可继续调参重新压缩");
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "压缩失败");
  } finally {
    isCompressing.value = false;
  }
}

function handleDownload() {
  if (!compressedFile.value) {
    ElMessage.warning("请先生成压缩结果");
    return;
  }

  const downloadUrl = URL.createObjectURL(compressedFile.value);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = outputFileName.value;
  link.click();
  URL.revokeObjectURL(downloadUrl);
}

function handleReset() {
  sourceFile.value = null;
  sourceMeta.value = null;
  resetCompressedState();
  updatePreviewUrl("source", null);
  form.outputFormat = "image/jpeg";
  form.quality = 80;
}

onBeforeUnmount(() => {
  if (sourcePreviewUrl.value) {
    URL.revokeObjectURL(sourcePreviewUrl.value);
  }
  if (compressedPreviewUrl.value) {
    URL.revokeObjectURL(compressedPreviewUrl.value);
  }
});
</script>

<style scoped lang="less">
.page-image-compression {
  display: grid;
  gap: 20px;
}

.compression-hero,
.workbench-card,
.preview-card {
  border: none;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.compression-hero {
  padding: 8px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 32%),
    radial-gradient(circle at bottom right, rgba(249, 115, 22, 0.16), transparent 32%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(244, 248, 252, 0.96));
}

.hero-copy {
  display: grid;
  gap: 12px;
}

.hero-eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  color: #0369a1;
  background: rgba(14, 165, 233, 0.12);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0;
  font-size: 32px;
  color: #14213d;
}

.hero-copy p {
  margin: 0;
  max-width: 760px;
  color: #526581;
  line-height: 1.7;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-header h2 {
  margin: 0;
  font-size: 22px;
  color: #14213d;
}

.card-header p {
  margin: 8px 0 0;
  color: #606266;
  line-height: 1.6;
}

.workbench-layout {
  display: grid;
  gap: 18px;
}

.workbench-main {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 20px;
  align-items: start;
}

.workbench-column {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.workbench-column--compact {
  align-content: start;
}

.upload-panel {
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    border-radius: 20px;
    border: 1px dashed rgba(14, 165, 233, 0.4);
    background: linear-gradient(180deg, #f8fcff, #f5f8ff);
  }
}

.upload-icon {
  margin-bottom: 12px;
  font-size: 30px;
  color: #0ea5e9;
}

.upload-tip {
  margin-top: 10px;
  color: #6b7280;
}

.source-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-item,
.stat-item {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc, #eef6ff);
}

.summary-item span,
.stat-item span {
  color: #526581;
  font-size: 13px;
}

.summary-item strong,
.stat-item strong {
  color: #14213d;
  font-size: 16px;
  word-break: break-word;
}

.compression-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__content) {
    width: 100%;
  }
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 10px;
}

.quality-panel {
  display: grid;
  gap: 14px;
  width: 100%;
}

.quality-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.quality-header strong {
  display: block;
  color: #14213d;
  font-size: 26px;
}

.quality-header span {
  color: #606266;
  font-size: 13px;
}

.quality-progress {
  cursor: pointer;
  outline: none;
}

.quality-progress:focus-visible {
  border-radius: 999px;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.18);
}

.quality-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.field-tip {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
  font-size: 12px;
}

.action-rail {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  & :deep(.el-button) {
    min-width: 132px;
    min-height: 42px;
    margin-left: 0;
  }
}

.process-panel {
  display: grid;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 18px;
  background: #f8fafc;
}

.process-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #475569;
}

.workbench-summary {
  margin-top: 0;
}

.preview-stage {
  display: grid;
  place-items: center;
  min-height: 260px;
  padding: 18px;
  border-radius: 20px;
  background:
    linear-gradient(45deg, rgba(15, 23, 42, 0.03) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(15, 23, 42, 0.03) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(15, 23, 42, 0.03) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(15, 23, 42, 0.03) 75%);
  background-size: 18px 18px;
  background-position:
    0 0,
    0 9px,
    9px -9px,
    -9px 0;
}

.preview-stage img {
  max-width: 100%;
  max-height: 360px;
  border-radius: 16px;
  object-fit: contain;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.comparison-banner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 16px 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(34, 197, 94, 0.1));
}

.comparison-banner span {
  display: block;
  color: #526581;
  font-size: 13px;
}

.comparison-banner strong {
  color: #14213d;
  font-size: 18px;
}

@media (max-width: 1080px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }

  .workbench-main {
    grid-template-columns: 1fr;
  }

  .comparison-banner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 780px) {
  .hero-copy h1 {
    font-size: 28px;
  }

  .card-header {
    flex-direction: column;
  }

  .config-grid,
  .source-summary,
  .stats-grid,
  .comparison-banner {
    grid-template-columns: 1fr;
  }

  .action-rail {
    width: 100%;
  }

  .action-rail :deep(.el-button) {
    width: 100%;
  }
}
</style>
