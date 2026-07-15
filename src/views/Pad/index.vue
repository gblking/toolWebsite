<template>
  <div class="page-pad">
    <el-backtop :right="40" :bottom="40" />
    <el-card shadow="never" class="pad-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Tool Notes</span>
        <h1>便签资源导航</h1>
        <p>
          基于 `pad.json` 的常用资源便签页，沿用当前站点的卡片化展示方式，
          支持按分类、关键词和 tag 进行模糊筛选。
        </p>
      </div>

      <div class="hero-tags">
        <el-tag type="primary">分类检索</el-tag>
        <el-tag type="success">Tag 搜索</el-tag>
        <el-tag type="warning">新窗口打开</el-tag>
        <el-tag>{{ totalItemCount }} 条资源</el-tag>
      </div>
    </el-card>

    <el-card shadow="never" class="filter-card">
      <div class="filter-layout">
        <div>
          <div class="card-header">
            <div>
              <h2>搜索表单</h2>
              <p>
                分类、名称、描述和 tag，支持模糊搜索。
              </p>
            </div>
            <el-button plain @click="resetFilters">重置筛选</el-button>
          </div>

          <el-form label-position="top" class="search-form">
            <div class="search-grid">
              <el-form-item label="分类 / 关键词">
                <el-input
                  v-model="filters.keyword"
                  clearable
                  placeholder="例如：前端、图标库、element"
                />
              </el-form-item>

              <el-form-item label="Tag">
                <el-input
                  v-model="filters.tag"
                  clearable
                  placeholder="例如：vue、react、小程序"
                />
              </el-form-item>
            </div>

            <div class="anchor-panel">
              <div class="anchor-panel__header">
                <span>分类导航</span>
                <span>根据当前筛选结果动态跳转</span>
              </div>

              <div v-if="anchorGroups.length" class="anchor-list">
                <el-button
                  v-for="group in anchorGroups"
                  :key="group.category"
                  plain
                  type="info"
                  size="small"
                  class="anchor-button"
                  @click="scrollToCategory(group.category)"
                >
                  {{ group.category }}
                </el-button>
              </div>

              <div v-else class="anchor-empty">
                当前筛选条件下暂无可跳转分类
              </div>
            </div>
          </el-form>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span>分类总数</span>
            <strong>{{ totalCategoryCount }}</strong>
          </div>
          <div class="stat-item">
            <span>资源总数</span>
            <strong>{{ totalItemCount }}</strong>
          </div>
          <div class="stat-item">
            <span>当前匹配</span>
            <strong>{{ filteredItemCount }}</strong>
          </div>
        </div>
      </div>
    </el-card>

    <div v-if="filteredGroups.length" class="category-list">
      <section
        v-for="group in filteredGroups"
        :key="group.category"
        class="category-section"
        :ref="(element) => setSectionRef(group.category, element)"
      >
        <div class="section-header">
          <div>
            <span class="section-eyebrow">Category</span>
            <h2>{{ group.category }}</h2>
          </div>
          <el-tag type="info" effect="light">{{ group.items.length }} 个结果</el-tag>
        </div>

        <div class="note-grid">
          <el-card
            v-for="item in group.items"
            :key="`${group.category}-${item.label}`"
            shadow="hover"
            class="note-card"
            tabindex="0"
            role="link"
            @click="openLink(item.href)"
            @keyup.enter="openLink(item.href)"
            @keyup.space.prevent="openLink(item.href)"
          >
            <div class="note-card__body">
              <div class="note-card__meta">
                <el-tag size="small" effect="plain" type="primary">
                  {{ group.category }}
                </el-tag>
                <span class="note-card__host">{{ formatHost(item.href) }}</span>
              </div>

              <h3 class="note-card__title">{{ item.label }}</h3>

              <el-tooltip
                :content="item.descript"
                placement="top"
                :show-after="200"
              >
                <p class="note-card__description">{{ item.descript }}</p>
              </el-tooltip>

              <div class="note-card__tags">
                <el-tag
                  v-for="tag in item.tags"
                  :key="tag"
                  size="small"
                  effect="light"
                  type="success"
                >
                  {{ tag }}
                </el-tag>
              </div>

              <div class="note-card__footer">
                <span>点击卡片即可访问</span>
                <span>新窗口打开</span>
              </div>
            </div>
          </el-card>
        </div>
      </section>
    </div>

    <el-card v-else shadow="never" class="empty-card">
      <el-empty description="暂无匹配结果，试试更宽泛的分类或 tag 关键词" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive } from "vue";
import padRaw from "@/assets/js/pad.json?raw";

interface PadItemSource {
  label: string;
  descript: string;
  href: string;
  tag?: string;
}

interface PadCard extends PadItemSource {
  category: string;
  tags: string[];
  searchIndex: string;
  tagIndex: string;
}

interface PadGroup {
  category: string;
  items: PadCard[];
}

type PadSource = Record<string, PadItemSource[]>;

const padSource = JSON.parse(padRaw) as PadSource;
const sectionRefs = new Map<string, HTMLElement>();

const filters = reactive({
  keyword: "",
  tag: "",
});

const allCards = computed<PadCard[]>(() =>
  Object.entries(padSource).flatMap(([category, items]) =>
    items.map((item) => {
      const tags = splitTags(item.tag);

      return {
        ...item,
        category,
        tags,
        searchIndex: normalizeText([category, item.label, item.descript].join(" ")),
        tagIndex: normalizeText(tags.join(" ")),
      };
    }),
  ),
);

const filteredGroups = computed<PadGroup[]>(() => {
  const keyword = normalizeText(filters.keyword);
  const tag = normalizeText(filters.tag);
  const groups = new Map<string, PadCard[]>();

  allCards.value.forEach((item) => {
    const keywordMatched = !keyword || item.searchIndex.includes(keyword);
    const tagMatched = !tag || item.tagIndex.includes(tag);

    if (!keywordMatched || !tagMatched) {
      return;
    }

    const groupItems = groups.get(item.category);

    if (groupItems) {
      groupItems.push(item);
      return;
    }

    groups.set(item.category, [item]);
  });

  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    items,
  }));
});

const totalCategoryCount = computed(() => Object.keys(padSource).length);
const totalItemCount = computed(() => allCards.value.length);
const filteredItemCount = computed(() =>
  filteredGroups.value.reduce((sum, group) => sum + group.items.length, 0),
);
const anchorGroups = computed(() => filteredGroups.value);

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function splitTags(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resetFilters() {
  filters.keyword = "";
  filters.tag = "";
}

function setSectionRef(
  category: string,
  element: Element | { $el?: Element } | null,
) {
  const componentElement =
    element && typeof element === "object" && "$el" in element
      ? element.$el
      : null;
  const target =
    element instanceof HTMLElement
      ? element
      : componentElement instanceof HTMLElement
        ? componentElement
        : null;

  if (target) {
    sectionRefs.set(category, target);
    return;
  }

  sectionRefs.delete(category);
}

async function scrollToCategory(category: string) {
  await nextTick();

  const target = sectionRefs.get(category);

  target?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function openLink(url: string) {
  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function formatHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
</script>

<style scoped lang="less">
.page-pad {
  display: grid;
  gap: 20px;
}

.pad-hero,
.filter-card,
.empty-card,
.note-card {
  border: none;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.pad-hero {
  padding: 8px;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.18), transparent 30%),
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
  color: #0f766e;
  background: rgba(20, 184, 166, 0.12);
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

.filter-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 0.8fr);
  gap: 20px;
  align-items: start;
}

.card-header,
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-header h2,
.section-header h2 {
  margin: 0;
  font-size: 22px;
  color: #14213d;
}

.card-header p {
  margin: 8px 0 0;
  color: #606266;
  line-height: 1.6;
}

.search-form {
  margin-top: 18px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__content) {
    width: 100%;
  }
}

.anchor-panel {
  display: grid;
  gap: 12px;
  width: 100%;
  margin-top: 68px;
  padding: 20px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc, #f4f8ff);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.anchor-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #526581;
  font-size: 12px;
}

.anchor-panel__header span:first-child {
  color: #14213d;
  font-size: 13px;
  font-weight: 700;
}

.anchor-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.anchor-button {
  margin-left: 0;
}

.anchor-empty {
  color: #7c8aa5;
  font-size: 13px;
  line-height: 1.6;
}

.search-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.stats-grid {
  display: grid;
  gap: 12px;
}

.stat-item {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc, #eef6ff);
}

.stat-item span {
  color: #526581;
  font-size: 13px;
}

.stat-item strong {
  color: #14213d;
  font-size: 24px;
}

.category-list {
  display: grid;
  gap: 24px;
}

.category-section {
  display: grid;
  gap: 14px;
}

.section-eyebrow {
  display: inline-flex;
  margin-bottom: 6px;
  color: #7c8aa5;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.note-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
}

.note-card {
  height: 100%;
  cursor: pointer;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 255, 0.98));
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.12);
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(37, 99, 235, 0.16),
      0 24px 48px rgba(15, 23, 42, 0.12);
  }

  :deep(.el-card__body) {
    height: 100%;
    padding: 0;
  }
}

.note-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 252px;
  padding: 20px;
}

.note-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.note-card__host {
  color: #7c8aa5;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-card__title {
  margin: 0;
  color: #14213d;
  font-size: 22px;
  line-height: 1.3;
  height: calc(1.3em * 2);
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.note-card__description {
  margin: 0;
  height: calc(1.7em * 2);
  color: #526581;
  line-height: 1.7;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.note-card__tags {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 8px;
  min-height: 32px;
  max-height: 56px;
  overflow: hidden;
}

.note-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 12px;
  color: #7c8aa5;
  font-size: 12px;
  border-top: 1px solid rgba(20, 33, 61, 0.08);
}

@media (max-width: 1080px) {
  .note-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-copy h1 {
    font-size: 28px;
  }

  .card-header,
  .section-header {
    flex-direction: column;
  }

  .search-grid {
    grid-template-columns: 1fr;
  }

  .note-grid {
    grid-template-columns: 1fr;
  }

  .note-card__body {
    min-height: 260px;
  }

  .note-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
