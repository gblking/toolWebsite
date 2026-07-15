<template>
  <div class="page-encrypt">
    <el-card shadow="never" class="encrypt-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Crypto Workbench</span>
        <h1>加解密与编码工具</h1>
        <p>
          基于 Element Plus、CryptoJS、sm-crypto 和 JSEncrypt
          实现。常见参数放在左侧，核心操作固定在右侧，减少视线跳转和状态抖动。
        </p>
      </div>

      <div class="hero-tags">
        <el-tag type="primary">对称加密</el-tag>
        <el-tag type="primary">国密算法</el-tag>
        <el-tag type="primary">摘要校验</el-tag>
        <el-tag type="primary">编码转换</el-tag>
      </div>
    </el-card>

    <div class="content-grid">
      <el-card shadow="never" class="workbench-card">
        <template #header>
          <div class="card-header">
            <div>
              <h2>处理面板</h2>
              <p>{{ currentAlgorithm.description }}</p>
            </div>
            <el-tag
              :type="currentAlgorithm.supported ? 'success' : 'warning'"
              effect="light"
            >
              {{ currentAlgorithm.supported ? "已支持" : "待实现" }}
            </el-tag>
          </div>
        </template>

        <el-form label-position="top" class="encrypt-form">
          <div class="form-grid">
            <div class="workbench-layout">
              <div class="config-panel">
                <div class="config-panel__row">
                  <el-form-item class="config-panel__item" label="算法">
                    <el-select
                      v-model="form.algorithm"
                      placeholder="请选择算法"
                    >
                      <el-option-group
                        v-for="group in algorithmGroups"
                        :key="group.label"
                        :label="group.label"
                      >
                        <el-option
                          v-for="item in group.options"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                          :disabled="!item.supported"
                        />
                      </el-option-group>
                    </el-select>
                  </el-form-item>

                  <el-form-item class="config-panel__item" label="操作">
                    <el-radio-group v-model="form.action" class="action-group">
                      <el-radio
                        v-for="action in availableActions"
                        :key="action"
                        :label="action"
                        :value="action"
                      >
                        {{ actionLabelMap[action] }}
                      </el-radio>
                    </el-radio-group>
                  </el-form-item>
                </div>

                <el-form-item
                  v-if="showHmacMode"
                  class="config-panel__item"
                  label="HMAC 算法"
                >
                  <el-select
                    v-model="form.hmacVariant"
                    placeholder="请选择 HMAC 算法"
                  >
                    <el-option label="HMAC-SHA1" value="SHA-1" />
                    <el-option label="HMAC-SHA256" value="SHA-256" />
                    <el-option label="HMAC-SHA512" value="SHA-512" />
                  </el-select>
                </el-form-item>

                <el-form-item class="config-panel__item" :label="keyLabel">
                  <el-input
                    v-model="form.secret"
                    type="textarea"
                    :rows="currentAlgorithm.requiresKey ? 3 : 2"
                    resize="none"
                    :disabled="!currentAlgorithm.requiresKey"
                    :placeholder="
                      currentAlgorithm.requiresKey
                        ? keyPlaceholder
                        : '当前算法不需要密钥，输入框已禁用'
                    "
                  />
                </el-form-item>

                <p class="toolbar-tip">
                  <el-icon><InfoFilled /></el-icon>{{ algorithmTip }}
                </p>
              </div>

              <div class="action-rail">
                <el-button type="primary" @click="handleTransform">
                  {{ primaryActionLabel }}
                </el-button>
                <el-button
                  type="warning"
                  @click="handleSwap"
                  :disabled="!result"
                >
                  结果回填
                </el-button>
                <el-button type="danger" @click="handleReset"> 清空 </el-button>
              </div>
            </div>

            <el-form-item class="full-width input-panel" label="输入内容">
              <el-input
                v-model="form.input"
                type="textarea"
                :rows="10"
                resize="vertical"
                :placeholder="inputPlaceholder"
              />
            </el-form-item>
          </div>
        </el-form>
      </el-card>

      <div class="side-column">
        <el-card shadow="never" class="result-card">
          <template #header>
            <div class="card-header">
              <div>
                <h2>结果输出</h2>
                <p>{{ resultMeta }}</p>
              </div>
              <el-button
                type="primary"
                :disabled="!result"
                :icon="CopyDocument"
                @click="handleCopy(result)"
              >
                复制结果
              </el-button>
            </div>
          </template>

          <el-input
            :model-value="result"
            type="textarea"
            :rows="12"
            resize="none"
            readonly
            placeholder="处理结果会显示在这里"
          />

          <div class="result-stats">
            <div class="stat-item">
              <span>长度</span>
              <strong>{{ result.length }}</strong>
            </div>
            <div class="stat-item">
              <span>算法</span>
              <strong>{{ currentAlgorithm.label }}</strong>
            </div>
            <div class="stat-item">
              <span>操作</span>
              <strong>{{ primaryActionLabel }}</strong>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { CopyDocument, InfoFilled } from "@element-plus/icons-vue";
import CryptoJS from "crypto-js";
import { JSEncrypt } from "jsencrypt";
import { sm2, sm3, sm4 } from "sm-crypto";

type SupportedAction = "encrypt" | "decrypt" | "digest" | "encode" | "decode";
type SupportedAlgorithm =
  | "AES"
  | "DES"
  | "TRIPLE_DES"
  | "RABBIT"
  | "RC4"
  | "MD5"
  | "SHA1"
  | "SHA256"
  | "SHA512"
  | "HMAC"
  | "BASE64"
  | "URL"
  | "SM2"
  | "SM4"
  | "SM3"
  | "RSA";

type KeyKind = "secret" | "public" | "private";

interface AlgorithmOption {
  value: SupportedAlgorithm;
  label: string;
  description: string;
  supported: boolean;
  requiresKey: boolean;
  actions: SupportedAction[];
}

interface AlgorithmGroup {
  label: string;
  options: AlgorithmOption[];
}

interface EncryptFormState {
  algorithm: SupportedAlgorithm;
  action: SupportedAction;
  secret: string;
  input: string;
  hmacVariant: "SHA-1" | "SHA-256" | "SHA-512";
}

const algorithmGroups: AlgorithmGroup[] = [
  {
    label: "对称加解密",
    options: [
      {
        value: "AES",
        label: "AES",
        description: "高级加密标准，适合常规文本加解密。",
        supported: true,
        requiresKey: true,
        actions: ["encrypt", "decrypt"],
      },
      {
        value: "DES",
        label: "DES",
        description: "经典分组加密算法，保留兼容场景使用。",
        supported: true,
        requiresKey: true,
        actions: ["encrypt", "decrypt"],
      },
      {
        value: "TRIPLE_DES",
        label: "Triple DES",
        description: "Triple DES 三重加密形式，兼顾老系统兼容。",
        supported: true,
        requiresKey: true,
        actions: ["encrypt", "decrypt"],
      },
      {
        value: "RABBIT",
        label: "Rabbit",
        description: "流加密算法，适合快速加解密演示。",
        supported: true,
        requiresKey: true,
        actions: ["encrypt", "decrypt"],
      },
      {
        value: "RC4",
        label: "RC4",
        description: "RC4 流加密算法，仅建议用于兼容处理。",
        supported: true,
        requiresKey: true,
        actions: ["encrypt", "decrypt"],
      },
      {
        value: "SM4",
        label: "SM4",
        description: "国密对称加密算法，默认使用 ECB + PKCS#7。",
        supported: true,
        requiresKey: true,
        actions: ["encrypt", "decrypt"],
      },
    ],
  },
  {
    label: "非对称加解密",
    options: [
      {
        value: "SM2",
        label: "SM2",
        description: "国密椭圆曲线算法，加密使用公钥，解密使用私钥。",
        supported: true,
        requiresKey: true,
        actions: ["encrypt", "decrypt"],
      },
      {
        value: "RSA",
        label: "RSA",
        description: "RSA 公钥加密、私钥解密，密钥格式使用 PEM。",
        supported: true,
        requiresKey: true,
        actions: ["encrypt", "decrypt"],
      },
    ],
  },
  {
    label: "摘要与校验",
    options: [
      {
        value: "MD5",
        label: "MD5",
        description: "单向摘要算法，仅支持生成摘要。",
        supported: true,
        requiresKey: false,
        actions: ["digest"],
      },
      {
        value: "SHA1",
        label: "SHA-1",
        description: "SHA-1 摘要算法，仅支持生成摘要。",
        supported: true,
        requiresKey: false,
        actions: ["digest"],
      },
      {
        value: "SHA256",
        label: "SHA-256",
        description: "SHA-256 摘要算法，仅支持生成摘要。",
        supported: true,
        requiresKey: false,
        actions: ["digest"],
      },
      {
        value: "SHA512",
        label: "SHA-512",
        description: "SHA-512 摘要算法，仅支持生成摘要。",
        supported: true,
        requiresKey: false,
        actions: ["digest"],
      },
      {
        value: "HMAC",
        label: "HMAC",
        description: "带密钥摘要认证，支持 HMAC-SHA1/SHA256/SHA512。",
        supported: true,
        requiresKey: true,
        actions: ["digest"],
      },
      {
        value: "SM3",
        label: "SM3",
        description: "国密摘要算法，仅支持生成摘要。",
        supported: true,
        requiresKey: false,
        actions: ["digest"],
      },
    ],
  },
  {
    label: "编码转换",
    options: [
      {
        value: "BASE64",
        label: "Base64编码解码",
        description: "支持 UTF-8 文本的 Base64 编码与解码。",
        supported: true,
        requiresKey: false,
        actions: ["encode", "decode"],
      },
      {
        value: "URL",
        label: "URL 编码解码",
        description: "适用于 URL 参数的编码与解码。",
        supported: true,
        requiresKey: false,
        actions: ["encode", "decode"],
      },
    ],
  },
];

const algorithmMap = Object.fromEntries(
  algorithmGroups.flatMap((group) =>
    group.options.map((item) => [item.value, item]),
  ),
) as Record<SupportedAlgorithm, AlgorithmOption>;

const actionLabelMap: Record<SupportedAction, string> = {
  encrypt: "加密",
  decrypt: "解密",
  digest: "生成摘要",
  encode: "编码",
  decode: "解码",
};

const form = reactive<EncryptFormState>({
  algorithm: "AES",
  action: "encrypt",
  secret: "",
  input: "",
  hmacVariant: "SHA-256",
});

const result = ref("");

const currentAlgorithm = computed(() => algorithmMap[form.algorithm]);
const availableActions = computed(() => currentAlgorithm.value.actions);
const showHmacMode = computed(() => form.algorithm === "HMAC");
const primaryActionLabel = computed(() => actionLabelMap[form.action]);

const currentKeyKind = computed<KeyKind>(() => {
  if (form.algorithm === "SM2" || form.algorithm === "RSA") {
    return form.action === "decrypt" ? "private" : "public";
  }
  return "secret";
});

const keyLabel = computed(() => {
  if (currentKeyKind.value === "public") {
    return "公钥";
  }
  if (currentKeyKind.value === "private") {
    return "私钥";
  }
  return "密钥";
});

const keyPlaceholder = computed(() => {
  switch (form.algorithm) {
    case "SM2":
      return form.action === "encrypt"
        ? "请输入 SM2 公钥（16 进制，支持 04 开头未压缩公钥）"
        : "请输入 SM2 私钥（16 进制）";
    case "RSA":
      return form.action === "encrypt"
        ? "请输入 RSA 公钥（PEM 格式）"
        : "请输入 RSA 私钥（PEM 格式）";
    case "SM4":
      return "请输入 32 位十六进制 SM4 密钥";
    case "HMAC":
      return "请输入 HMAC 密钥";
    default:
      return "请输入密钥";
  }
});

const algorithmTip = computed(() => {
  if (!currentAlgorithm.value.requiresKey) {
    if (form.algorithm === "SM3") {
      return "SM3 为国密摘要算法，不需要密钥。";
    }
    return "该算法不需要密钥，已保留禁用态密钥输入框以维持操作区稳定。";
  }

  if (form.algorithm === "HMAC") {
    return `当前使用 ${form.hmacVariant} 计算 HMAC，密钥不能为空。`;
  }

  if (form.algorithm === "SM2") {
    return form.action === "encrypt"
      ? "SM2 加密请输入公钥，解密时请输入对应私钥。"
      : "SM2 解密请输入私钥，密文建议使用 sm-crypto 默认的 C1C3C2 格式。";
  }

  if (form.algorithm === "RSA") {
    return form.action === "encrypt"
      ? "RSA 加密请输入 PEM 格式公钥。"
      : "RSA 解密请输入 PEM 格式私钥。";
  }

  if (form.algorithm === "SM4") {
    return "SM4 默认使用 ECB + PKCS#7，密钥需为 32 位十六进制字符串。";
  }

  return "当前算法需要密钥，请确保输入内容与密钥配套。";
});

const inputPlaceholder = computed(() => {
  if (form.action === "decrypt" || form.action === "decode") {
    return "请输入待解密或待解码内容";
  }
  if (form.action === "digest") {
    return "请输入待生成摘要的原文";
  }
  return "请输入待处理内容";
});

const resultMeta = computed(() => {
  if (!result.value) {
    return "暂无结果";
  }
  return `${currentAlgorithm.value.label} · ${primaryActionLabel.value}`;
});

watch(
  () => form.algorithm,
  (algorithm) => {
    const option = algorithmMap[algorithm];
    if (!option.actions.includes(form.action)) {
      form.action = option.actions[0];
    }
    form.secret = "";
    result.value = "";
  },
);

watch(
  () => form.action,
  () => {
    form.secret = "";
    result.value = "";
  },
);

function encodeBase64(value: string) {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(value));
}

function decodeBase64(value: string) {
  return CryptoJS.enc.Base64.parse(value).toString(CryptoJS.enc.Utf8);
}

function ensureDecryptResult(value: string | false | null) {
  if (!value) {
    throw new Error("解密或解码结果为空，请检查输入内容和密钥是否正确。");
  }
  return value;
}

function ensureHexKey(value: string, length?: number) {
  const normalized = value.trim();
  if (!/^[0-9a-fA-F]+$/.test(normalized)) {
    throw new Error("该算法要求输入十六进制密钥。");
  }
  if (length && normalized.length !== length) {
    throw new Error(`该算法要求密钥长度为 ${length} 位十六进制字符。`);
  }
  return normalized;
}

function ensurePemKey(value: string) {
  if (!value.includes("BEGIN") || !value.includes("END")) {
    throw new Error("RSA 密钥需使用 PEM 格式。");
  }
  return value.trim();
}

function buildHash(value: string) {
  switch (form.algorithm) {
    case "MD5":
      return CryptoJS.MD5(value).toString(CryptoJS.enc.Hex);
    case "SHA1":
      return CryptoJS.SHA1(value).toString(CryptoJS.enc.Hex);
    case "SHA256":
      return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
    case "SHA512":
      return CryptoJS.SHA512(value).toString(CryptoJS.enc.Hex);
    case "HMAC":
      if (form.hmacVariant === "SHA-1") {
        return CryptoJS.HmacSHA1(value, form.secret).toString(CryptoJS.enc.Hex);
      }
      if (form.hmacVariant === "SHA-512") {
        return CryptoJS.HmacSHA512(value, form.secret).toString(
          CryptoJS.enc.Hex,
        );
      }
      return CryptoJS.HmacSHA256(value, form.secret).toString(CryptoJS.enc.Hex);
    case "SM3":
      return sm3(value);
    default:
      throw new Error("当前摘要算法暂未实现。");
  }
}

function runSm2Transform() {
  if (form.action === "encrypt") {
    return sm2.doEncrypt(form.input, form.secret.trim(), 1);
  }
  return ensureDecryptResult(
    sm2.doDecrypt(form.input.trim(), form.secret.trim(), 1),
  );
}

function runSm4Transform() {
  const sm4Key = ensureHexKey(form.secret, 32);
  if (form.action === "encrypt") {
    return sm4.encrypt(form.input, sm4Key);
  }
  return ensureDecryptResult(sm4.decrypt(form.input.trim(), sm4Key));
}

function runRsaTransform() {
  const crypt = new JSEncrypt();
  if (form.action === "encrypt") {
    crypt.setPublicKey(ensurePemKey(form.secret));
    return ensureDecryptResult(crypt.encrypt(form.input));
  }
  crypt.setPrivateKey(ensurePemKey(form.secret));
  return ensureDecryptResult(crypt.decrypt(form.input));
}

function runTransform() {
  switch (form.algorithm) {
    case "AES":
      return form.action === "encrypt"
        ? CryptoJS.AES.encrypt(form.input, form.secret).toString()
        : ensureDecryptResult(
            CryptoJS.AES.decrypt(form.input, form.secret).toString(
              CryptoJS.enc.Utf8,
            ),
          );
    case "DES":
      return form.action === "encrypt"
        ? CryptoJS.DES.encrypt(form.input, form.secret).toString()
        : ensureDecryptResult(
            CryptoJS.DES.decrypt(form.input, form.secret).toString(
              CryptoJS.enc.Utf8,
            ),
          );
    case "TRIPLE_DES":
      return form.action === "encrypt"
        ? CryptoJS.TripleDES.encrypt(form.input, form.secret).toString()
        : ensureDecryptResult(
            CryptoJS.TripleDES.decrypt(form.input, form.secret).toString(
              CryptoJS.enc.Utf8,
            ),
          );
    case "RABBIT":
      return form.action === "encrypt"
        ? CryptoJS.Rabbit.encrypt(form.input, form.secret).toString()
        : ensureDecryptResult(
            CryptoJS.Rabbit.decrypt(form.input, form.secret).toString(
              CryptoJS.enc.Utf8,
            ),
          );
    case "RC4":
      return form.action === "encrypt"
        ? CryptoJS.RC4.encrypt(form.input, form.secret).toString()
        : ensureDecryptResult(
            CryptoJS.RC4.decrypt(form.input, form.secret).toString(
              CryptoJS.enc.Utf8,
            ),
          );
    case "SM2":
      return runSm2Transform();
    case "SM4":
      return runSm4Transform();
    case "RSA":
      return runRsaTransform();
    case "MD5":
    case "SHA1":
    case "SHA256":
    case "SHA512":
    case "HMAC":
    case "SM3":
      return buildHash(form.input);
    case "BASE64":
      return form.action === "encode"
        ? encodeBase64(form.input)
        : ensureDecryptResult(decodeBase64(form.input));
    case "URL":
      return form.action === "encode"
        ? encodeURIComponent(form.input)
        : ensureDecryptResult(decodeURIComponent(form.input));
    default:
      throw new Error(`${currentAlgorithm.value.label} 暂未实现。`);
  }
}

function validateForm() {
  if (!form.input) {
    throw new Error("请输入待处理内容。");
  }

  if (currentAlgorithm.value.requiresKey && !form.secret.trim()) {
    throw new Error(`当前算法需要${keyLabel.value}。`);
  }

  if (form.algorithm === "SM4" && currentAlgorithm.value.requiresKey) {
    ensureHexKey(form.secret, 32);
  }

  if (form.algorithm === "RSA" && currentAlgorithm.value.requiresKey) {
    ensurePemKey(form.secret);
  }
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

function handleTransform() {
  try {
    validateForm();
    result.value = runTransform();
    ElMessage.success(`${primaryActionLabel.value}完成`);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "处理失败");
  }
}

function handleReset() {
  form.secret = "";
  form.input = "";
  result.value = "";
}

function handleSwap() {
  if (!result.value) {
    return;
  }

  form.input = result.value;
  result.value = "";
}

async function handleCopy(value: string) {
  if (!value) {
    ElMessage.warning("暂无可复制内容");
    return;
  }

  try {
    await copyText(value);
    ElMessage.success("复制成功");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "复制失败");
  }
}
</script>

<style scoped lang="less">
.page-encrypt {
  display: grid;
  gap: 20px;
}

.encrypt-hero,
.workbench-card,
.result-card {
  border: none;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.encrypt-hero {
  padding: 8px;
  background:
    radial-gradient(
      circle at top left,
      rgba(29, 78, 216, 0.16),
      transparent 30%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(249, 115, 22, 0.14),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.96),
      rgba(246, 248, 252, 0.96)
    );
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
  color: #1d4ed8;
  background: rgba(29, 78, 216, 0.1);
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
  max-width: 720px;
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

.encrypt-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__content) {
    width: 100%;
  }
}

.form-grid {
  display: grid;
  gap: 20px;
}

.full-width {
  width: 100%;
}

.workbench-layout {
  display: flex;
  gap: 20px;
  align-items: stretch;
}

.config-panel {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 18px;
}

.config-panel__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.config-panel__item {
  min-width: 0;
}

.action-group {
  display: flex;
  flex-wrap: wrap;
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

.toolbar-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  padding: 10px 14px;
  border-radius: 4px;
  background: #f8fafc;
  color: #526581;
  line-height: 1.65;
  font-size: 12px;
}

.input-panel {
  :deep(.el-form-item__label) {
    color: #14213d;
    font-weight: 600;
  }
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
  background: linear-gradient(180deg, #f8fafc, #eef2ff);
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

  .workbench-layout {
    flex-direction: column;
  }

  .config-panel__row,
  .result-stats {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
  }
}
</style>
