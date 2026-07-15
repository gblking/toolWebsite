<template>
  <div class="page-json-tools">
    <el-card shadow="never" class="json-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">JSON Workbench</span>
        <h1>JSON 校验与整理工具</h1>
        <p>
          支持 JSON 校验、格式化、压缩、复制、上传、下载与清空。
        </p>
      </div>

      <div class="hero-tags">
        <el-tag type="primary">校验</el-tag>
        <el-tag type="success">格式化</el-tag>
        <el-tag type="warning">压缩</el-tag>
        <el-tag>文件导入 / 导出</el-tag>
      </div>
    </el-card>

    <div class="content-grid">
      <el-card shadow="never" class="workbench-card">
        <template #header>
          <div class="card-header">
            <div>
              <h2>处理面板</h2>
              <p>{{ statusText }}</p>
            </div>
            <el-tag :type="statusTagType" effect="light">
              {{ statusLabel }}
            </el-tag>
          </div>
        </template>

        <div class="workbench-layout">
          <div class="editor-panel">
            <el-form label-position="top" class="json-form">
              <el-form-item label="JSON 输入内容" class="full-width">
                <el-input
                  v-model="form.input"
                  type="textarea"
                  :rows="18"
                  resize="vertical"
                  placeholder="请输入 JSON 内容，或通过右侧上传按钮导入文件"
                />
              </el-form-item>
            </el-form>
          </div>

          <div class="action-rail">
            <input
              ref="fileInputRef"
              type="file"
              accept=".json,application/json,text/plain"
              class="hidden-input"
              @change="handleFileSelect"
            />
            <el-button type="primary" @click="triggerFileUpload">
              上传文件
            </el-button>
            <el-button type="success" @click="handleValidate"> 校验 </el-button>
            <el-button type="warning" @click="handleFormat"> 格式化 </el-button>
            <el-button type="info" @click="handleMinify"> 压缩 </el-button>
            <el-button type="danger" @click="handleClear"> 清空 </el-button>
          </div>
        </div>
      </el-card>

      <div class="side-column">
        <el-card shadow="never" class="result-card">
          <template #header>
            <div class="card-header">
              <div>
                <h2>结果输出</h2>
                <p>{{ resultMeta }}</p>
              </div>
              <div class="header-actions">
                <el-button
                  type="primary"
                  :icon="CopyDocument"
                  :disabled="!displayText"
                  @click="handleCopy"
                >
                  复制
                </el-button>
                <el-button
                  type="success"
                  :icon="Download"
                  :disabled="!displayText"
                  @click="handleDownload"
                >
                  下载
                </el-button>
              </div>
            </div>
          </template>

          <el-input
            :model-value="displayText"
            type="textarea"
            :rows="18"
            resize="none"
            readonly
            placeholder="校验或整理后的结果会显示在这里"
          />

          <div class="result-stats">
            <div class="stat-item">
              <span>字符数</span>
              <strong>{{ displayText.length }}</strong>
            </div>
            <div class="stat-item">
              <span>行数</span>
              <strong>{{ lineCount }}</strong>
            </div>
            <div class="stat-item">
              <span>状态</span>
              <strong>{{ statusLabel }}</strong>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { CopyDocument, Download } from "@element-plus/icons-vue";

type StatusType = "idle" | "success" | "warning";

interface JsonFormState {
  input: string;
}

const form = reactive<JsonFormState>({
  input: "",
});

const result = ref("");
const status = ref<StatusType>("idle");
const statusText = ref("等待输入 JSON 内容");
const fileInputRef = ref<HTMLInputElement | null>(null);

const displayText = computed(() => result.value || form.input);
const lineCount = computed(() =>
  displayText.value ? displayText.value.split(/\r?\n/).length : 0,
);
const statusLabel = computed(() => {
  if (status.value === "success") {
    return "已完成";
  }
  if (status.value === "warning") {
    return "待处理";
  }
  return "未开始";
});
const statusTagType = computed(() => {
  if (status.value === "success") {
    return "success";
  }
  if (status.value === "warning") {
    return "warning";
  }
  return "info";
});
const resultMeta = computed(() => {
  if (result.value) {
    return "当前显示最近一次处理结果";
  }
  if (form.input) {
    return "当前显示输入区内容";
  }
  return "暂无可用内容";
});

function triggerFileUpload() {
  fileInputRef.value?.click();
}

function ensureInput() {
  if (!form.input.trim()) {
    throw new Error("请输入 JSON 内容或先上传文件。");
  }
}

function shouldParseNestedString(value: string) {
  const trimmed = value.trim();
  return (
    trimmed.startsWith("{") ||
    trimmed.startsWith("[") ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  );
}

function deepNormalizeJsonValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (!shouldParseNestedString(value)) {
      return value;
    }

    try {
      return deepNormalizeJsonValue(JSON.parse(value));
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepNormalizeJsonValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        deepNormalizeJsonValue(item),
      ]),
    );
  }

  return value;
}

function normalizeJsonValue(raw: string) {
  return deepNormalizeJsonValue(JSON.parse(raw));
}

function formatJsonContent(space: number) {
  ensureInput();
  const normalized = normalizeJsonValue(form.input.trim());
  return JSON.stringify(normalized, null, space);
}

function setSuccessState(message: string, nextResult = "") {
  result.value = nextResult;
  status.value = "success";
  statusText.value = message;
}

function resetToPending(message: string) {
  status.value = "warning";
  statusText.value = message;
}

async function readFileContent(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsText(file, "utf-8");
  });
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  try {
    const content = await readFileContent(file);
    form.input = content;
    result.value = "";
    resetToPending(`已读取文件：${file.name}`);
    ElMessage.success("文件内容已导入输入框");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "文件导入失败");
  } finally {
    input.value = "";
  }
}

function handleValidate() {
  try {
    ensureInput();
    normalizeJsonValue(form.input.trim());
    setSuccessState("JSON 校验通过");
    ElMessage.success("JSON 校验通过");
  } catch (error) {
    status.value = "warning";
    statusText.value =
      error instanceof Error ? error.message : "JSON 校验失败";
    ElMessage.error(statusText.value);
  }
}

function handleFormat() {
  try {
    const formatted = formatJsonContent(2);
    setSuccessState("JSON 已格式化", formatted);
    ElMessage.success("JSON 格式化完成");
  } catch (error) {
    status.value = "warning";
    statusText.value =
      error instanceof Error ? error.message : "JSON 格式化失败";
    ElMessage.error(statusText.value);
  }
}

function handleMinify() {
  try {
    const minified = formatJsonContent(0);
    setSuccessState("JSON 已压缩", minified);
    ElMessage.success("JSON 压缩完成");
  } catch (error) {
    status.value = "warning";
    statusText.value =
      error instanceof Error ? error.message : "JSON 压缩失败";
    ElMessage.error(statusText.value);
  }
}

function handleClear() {
  form.input = "";
  result.value = "";
  status.value = "idle";
  statusText.value = "等待输入 JSON 内容";
}

async function handleCopy() {
  if (!displayText.value) {
    ElMessage.warning("暂无可复制内容");
    return;
  }

  try {
    await copyText(displayText.value);
    ElMessage.success("复制成功");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "复制失败");
  }
}

function handleDownload() {
  if (!displayText.value) {
    ElMessage.warning("暂无可下载内容");
    return;
  }

  const blob = new Blob([displayText.value], {
    type: "application/json;charset=utf-8",
  });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(downloadUrl);
}
</script>

<style scoped lang="less">
.page-json-tools {
  display: grid;
  gap: 20px;
}

.json-hero,
.workbench-card,
.result-card {
  border: none;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.json-hero {
  padding: 8px;
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.16), transparent 30%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.16), transparent 32%),
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
  color: #15803d;
  background: rgba(34, 197, 94, 0.1);
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
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.side-column {
  display: grid;
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

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.json-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__content) {
    width: 100%;
  }
}

.workbench-layout {
  display: flex;
  gap: 20px;
  align-items: stretch;
}

.editor-panel {
  flex: 1;
  min-width: 0;
}

.full-width {
  width: 100%;
}

.action-rail {
  flex: 0 0 170px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 18px;

  & :deep(.el-button) {
    width: 100%;
    min-height: 42px;
    margin-left: 0;
  }
}

.hidden-input {
  display: none;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.stat-item {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc, #eef6ff);
}

.stat-item span {
  color: #526581;
  font-size: 13px;
}

.stat-item strong {
  color: #14213d;
  font-size: 16px;
  word-break: break-word;
}

@media (max-width: 1080px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero-copy h1 {
    font-size: 28px;
  }

  .card-header,
  .workbench-layout,
  .result-stats {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .header-actions,
  .action-rail {
    width: 100%;
  }

  .action-rail :deep(.el-button),
  .header-actions :deep(.el-button) {
    width: 100%;
  }
}
</style>
