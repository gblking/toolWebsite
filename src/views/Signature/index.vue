<template>
  <div class="page-signature">
    <el-card shadow="never" class="signature-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Signature Studio</span>
        <h1>个性签名生成工具</h1>
        <p>
          基于本地字体渲染与 Canvas 导出实现。左侧配置签名样式，右侧实时查看生成结果并下载
          PNG 图片，整体交互和其他工具页保持一致。
        </p>
      </div>

      <div class="hero-tags">
        <el-tag type="primary">字体渲染</el-tag>
        <el-tag type="success">实时预览</el-tag>
        <el-tag type="warning">PNG 导出</el-tag>
        <el-tag>样式配置</el-tag>
      </div>
    </el-card>

    <div class="content-grid">
      <el-card shadow="never" class="signature-card">
        <template #header>
          <div class="card-header">
            <div>
              <h2>签名配置</h2>
              <p>根据文本、字体、颜色和边框配置生成签名效果。</p>
            </div>
            <el-tag type="info" effect="light">
              {{ generating ? "生成中" : "待生成" }}
            </el-tag>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="signature-form"
        >
          <div class="form-grid">
            <el-form-item label="个性签名" prop="text" class="full-width">
              <el-input
                v-model="form.text"
                maxlength="30"
                show-word-limit
                placeholder="请输入要生成的签名文本"
              />
            </el-form-item>

            <el-form-item label="字体选择" prop="fontOptionKey">
              <el-select v-model="form.fontOptionKey" placeholder="请选择字体">
                <el-option
                  v-for="item in fontOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="字体大小" prop="fontSize">
              <el-select v-model="form.fontSize" placeholder="请选择字号">
                <el-option
                  v-for="size in fontSizeOptions"
                  :key="size"
                  :label="`${size}px`"
                  :value="size"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="背景颜色">
              <el-color-picker
                v-model="form.backgroundColor"
                :disabled="form.transparentBackground"
              />
            </el-form-item>

            <el-form-item label="背景透明">
              <el-checkbox v-model="form.transparentBackground">透明</el-checkbox>
            </el-form-item>

            <el-form-item label="字体颜色">
              <el-color-picker v-model="form.fontColor" />
            </el-form-item>

            <el-form-item label="边框">
              <el-checkbox v-model="form.showBorder">显示边框</el-checkbox>
            </el-form-item>

            <el-form-item label="边框颜色">
              <el-color-picker
                v-model="form.borderColor"
                :disabled="!form.showBorder"
              />
            </el-form-item>

            <el-form-item label="边距">
              <el-input-number v-model="form.padding" :min="0" :max="80" />
            </el-form-item>

            <el-form-item label="圆角">
              <el-input-number v-model="form.borderRadius" :min="0" :max="80" />
            </el-form-item>
          </div>

          <el-form-item class="form-actions">
            <el-button
              size="large"
              type="primary"
              :loading="generating"
              @click="handleGenerate"
            >
              生成签名
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="result-card">
        <template #header>
          <div class="card-header">
            <div>
              <h2>签名结果</h2>
              <p>
                {{
                  signatureData
                    ? signatureData.generatedAt
                    : "生成后可在这里预览并下载签名图片"
                }}
              </p>
            </div>
            <el-button
              type="primary"
              plain
              :disabled="!signatureData"
              :icon="Download"
              @click="handleDownload"
            >
              下载图片
            </el-button>
          </div>
        </template>

        <div v-if="signatureData" class="result-grid">
          <div class="preview-panel">
            <div class="preview-stage">
              <div class="signature-preview" :style="previewStyle">
                {{ signatureData.text }}
              </div>
            </div>
          </div>

          <div class="data-panel">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="签名文本">
                {{ signatureData.text }}
              </el-descriptions-item>
              <el-descriptions-item label="字体">
                {{ signatureData.fontLabel }}
              </el-descriptions-item>
              <el-descriptions-item label="字体文件">
                {{ signatureData.fontFile }}
              </el-descriptions-item>
              <el-descriptions-item label="字体大小">
                {{ signatureData.fontSize }}px
              </el-descriptions-item>
              <el-descriptions-item label="背景颜色">
                {{
                  signatureData.transparentBackground
                    ? "透明"
                    : signatureData.backgroundColor
                }}
              </el-descriptions-item>
              <el-descriptions-item label="字体颜色">
                {{ signatureData.fontColor }}
              </el-descriptions-item>
              <el-descriptions-item label="边框">
                {{
                  signatureData.showBorder
                    ? `1px solid ${signatureData.borderColor}`
                    : "无"
                }}
              </el-descriptions-item>
              <el-descriptions-item label="padding">
                {{ signatureData.padding }}px
              </el-descriptions-item>
              <el-descriptions-item label="border-radius">
                {{ signatureData.borderRadius }}px
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <el-empty v-else description="请先生成签名结果" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { CSSProperties } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import constantSource from "@/assets/js/constant.ts?raw";
import {Download} from '@element-plus/icons-vue';

interface SignatureForm {
  text: string;
  fontOptionKey: string;
  fontSize: number;
  backgroundColor: string;
  transparentBackground: boolean;
  fontColor: string;
  showBorder: boolean;
  borderColor: string;
  padding: number;
  borderRadius: number;
}

interface SignatureResult extends SignatureForm {
  fontFile: string;
  fontLabel: string;
  fontFamily: string;
  generatedAt: string;
}

interface FontOption {
  label: string;
  value: string;
  fileName: string;
}

const fontAssets = import.meta.glob(
  "../../assets/fonts/*.{ttf,TTF,otf,OTF,woff,WOFF,woff2,WOFF2}",
  {
  eager: true,
  import: "default",
  },
) as Record<string, string>;

const availableFonts = Object.entries(fontAssets).map(([path, url]) => ({
  fileName: path.split("/").pop() ?? "",
  url,
}));

function parseFontsMap(rawSource: string) {
  const parsed: FontOption[] = [];
  const usedFiles = new Set<string>();
  const entryPattern =
    /label\s*:\s*["']([^"']+)["']\s*,?\s*[\r\n\s]*value\s*:\s*["']([^"']+)["']/g;

  for (const match of rawSource.matchAll(entryPattern)) {
    const rawLabel = match[1];
    const rawValue = match[2];
    const matchedFile =
      availableFonts.find((item) => item.fileName === rawValue)?.fileName ??
      availableFonts.find(
        (item) =>
          !usedFiles.has(item.fileName) &&
          `${rawValue} ${rawLabel}`.toLowerCase().includes("cooper") &&
          item.fileName.toLowerCase().includes("cooper"),
      )?.fileName ??
      availableFonts.find((item) => !usedFiles.has(item.fileName))?.fileName ??
      rawValue;

    usedFiles.add(matchedFile);

    const fallbackLabel = matchedFile.replace(/\.[^.]+$/, "");
    const label =
      rawLabel && !rawLabel.includes("?") && !rawLabel.includes("锟")
        ? rawLabel
        : fallbackLabel;

    parsed.push({
      label,
      value: `${matchedFile}::${parsed.length}`,
      fileName: matchedFile,
    });
  }

  return parsed;
}

const fontOptions = parseFontsMap(constantSource);

const formRef = ref<FormInstance>();
const generating = ref(false);
const signatureData = ref<SignatureResult | null>(null);

const form = reactive<SignatureForm>({
  text: "",
  fontOptionKey: fontOptions[0]?.value ?? "",
  fontSize: 48,
  backgroundColor: "#fff4d6",
  transparentBackground: false,
  fontColor: "#303133",
  showBorder: true,
  borderColor: "#d97706",
  padding: 24,
  borderRadius: 18,
});

const rules: FormRules<SignatureForm> = {
  text: [{ required: true, message: "请输入个性签名", trigger: "blur" }],
  fontOptionKey: [{ required: true, message: "请选择字体", trigger: "change" }],
};

const fontSizeOptions = [24, 28, 32, 36, 40, 48, 56, 64, 72];

const fontUrlMap = Object.fromEntries(
  availableFonts.map((item) => [item.fileName, item.url]),
);
const loadedFontFamilyMap = new Map<string, string>();
const registeredFontStyleMap = new Map<string, HTMLStyleElement>();

const previewStyle = computed<CSSProperties>(() => {
  if (!signatureData.value) {
    return {};
  }

  return {
    fontFamily: signatureData.value.fontFamily,
    fontSize: `${signatureData.value.fontSize}px`,
    color: signatureData.value.fontColor,
    backgroundColor: signatureData.value.transparentBackground
      ? "transparent"
      : signatureData.value.backgroundColor,
    padding: `${signatureData.value.padding}px`,
    borderRadius: `${signatureData.value.borderRadius}px`,
    border: signatureData.value.showBorder
      ? `1px solid ${signatureData.value.borderColor}`
      : "none",
  };
});

function getSelectedFontOption(fontOptionKey: string) {
  return fontOptions.find((item) => item.value === fontOptionKey) ?? null;
}

function getFontLabel(fontOptionKey: string) {
  return getSelectedFontOption(fontOptionKey)?.label ?? fontOptionKey;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[\\/:*?"<>|]/g, "_").trim() || "signature";
}

function getFontFormat(fontFile: string) {
  const extension = fontFile.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "ttf":
      return "truetype";
    case "otf":
      return "opentype";
    case "woff":
      return "woff";
    case "woff2":
      return "woff2";
    default:
      return "";
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function ensureFontLoaded(fontFile: string) {
  const cachedFontFamily = loadedFontFamilyMap.get(fontFile);
  if (cachedFontFamily) {
    return cachedFontFamily;
  }

  const fontUrl = fontUrlMap[fontFile];
  if (!fontUrl) {
    throw new Error(`未找到字体文件：${fontFile}`);
  }

  const fontFamily = `signature-font-${loadedFontFamilyMap.size + 1}`;
  const fontFormat = getFontFormat(fontFile);
  const fontSource = fontFormat
    ? `url("${fontUrl}") format("${fontFormat}")`
    : `url("${fontUrl}")`;

  try {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @font-face {
        font-family: "${fontFamily}";
        src: ${fontSource};
        font-display: swap;
      }
    `;
    document.head.appendChild(styleElement);

    registeredFontStyleMap.set(fontFile, styleElement);

    const loadedFonts = await document.fonts.load(`48px "${fontFamily}"`, "签名");
    await document.fonts.ready;
    if (!loadedFonts.length) {
      throw new Error("浏览器未能完成字体注册");
    }
    loadedFontFamilyMap.set(fontFile, fontFamily);
  } catch (error) {
    const styleElement = registeredFontStyleMap.get(fontFile);
    if (styleElement) {
      styleElement.remove();
      registeredFontStyleMap.delete(fontFile);
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : "字体资源加载失败";
    throw new Error(`${fontFile} 加载失败：${message}`);
  }

  return fontFamily;
}

async function handleGenerate() {
  if (!formRef.value) {
    return;
  }

  try {
    generating.value = true;
    await formRef.value.validate();

    const selectedFont = getSelectedFontOption(form.fontOptionKey);
    if (!selectedFont) {
      throw new Error("当前字体选项无效，请重新选择字体");
    }

    const fontFamily = await ensureFontLoaded(selectedFont.fileName);

    signatureData.value = {
      ...form,
      fontFile: selectedFont.fileName,
      fontLabel: getFontLabel(form.fontOptionKey),
      fontFamily,
      generatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
    };
  } catch (error) {
    if (error instanceof Error && error.message) {
      ElMessage.error(error.message);
    }
  } finally {
    generating.value = false;
  }
}

async function handleDownload() {
  if (!signatureData.value) {
    return;
  }

  try {
    const data = signatureData.value;
    await document.fonts.ready;

    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    if (!measureCtx) {
      throw new Error("Unable to create canvas context");
    }

    measureCtx.font = `${data.fontSize}px "${data.fontFamily}"`;
    const metrics = measureCtx.measureText(data.text);
    const borderWidth = data.showBorder ? 1 : 0;
    const horizontalPadding = data.padding * 2 + borderWidth * 2;
    const verticalPadding = data.padding * 2 + borderWidth * 2;
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(data.fontSize * 1.4);
    const canvasWidth = Math.max(1, textWidth + horizontalPadding);
    const canvasHeight = Math.max(1, textHeight + verticalPadding);

    const pixelRatio = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(canvasWidth * pixelRatio);
    canvas.height = Math.ceil(canvasHeight * pixelRatio);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create canvas context");
    }

    ctx.scale(pixelRatio, pixelRatio);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (!data.transparentBackground || data.showBorder) {
      drawRoundedRect(
        ctx,
        0.5,
        0.5,
        canvasWidth - 1,
        canvasHeight - 1,
        data.borderRadius,
      );
      if (!data.transparentBackground) {
        ctx.fillStyle = data.backgroundColor;
        ctx.fill();
      }
      if (data.showBorder) {
        ctx.strokeStyle = data.borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.font = `${data.fontSize}px "${data.fontFamily}"`;
    ctx.fillStyle = data.fontColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(data.text, canvasWidth / 2, canvasHeight / 2);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${sanitizeFileName(data.text)}.png`;
    link.click();
  } catch (error) {
    if (error instanceof Error && error.message) {
      ElMessage.error(error.message);
    }
  }
}
</script>

<style scoped lang="less">
.page-signature {
  display: grid;
  gap: 20px;
}

.signature-hero,
.signature-card,
.result-card {
  border: none;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.signature-hero {
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

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
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

.signature-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__content) {
    width: 100%;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.full-width {
  grid-column: 1 / -1;
}

.form-actions {
  margin-top: 20px;
}

.result-grid {
  display: grid;
  gap: 20px;
}

.preview-panel,
.data-panel {
  min-width: 0;
}

.preview-stage {
  display: grid;
  place-items: center;
  min-height: 280px;
  padding: 24px;
  border-radius: 20px;
  background:
    linear-gradient(45deg, rgba(15, 23, 42, 0.03) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(15, 23, 42, 0.03) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(15, 23, 42, 0.03) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(15, 23, 42, 0.03) 75%);
  background-size: 24px 24px;
  background-position: 0 0, 0 12px, 12px -12px, -12px 0;
}

.signature-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
  text-align: center;
  word-break: break-word;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

@media (max-width: 1180px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .form-grid,
  .result-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 720px) {
  .hero-copy h1 {
    font-size: 28px;
  }
}
</style>
