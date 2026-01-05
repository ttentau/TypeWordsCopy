<script setup lang="ts">
import BackIcon from '@/components/BackIcon.vue'
import Empty from '@/components/Empty.vue'
import ArticleList from '@/components/list/ArticleList.vue'
import { useBaseStore } from '@/stores/base.ts'
import { Article, Dict, DictId, DictType } from '@/types/types.ts'
import { useRuntimeStore } from '@/stores/runtime.ts'
import BaseButton from '@/components/BaseButton.vue'
import { useRoute, useRouter } from 'vue-router'
import EditBook from '@/pages/article/components/EditBook.vue'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import {
  _dateFormat,
  _getDictDataByUrl,
  isMobile,
  msToHourMinute,
  resourceWrap,
  total,
  useNav,
  _nextTick,
} from '@/utils'
import { getDefaultArticle, getDefaultDict } from '@/types/func.ts'
import Toast from '@/components/base/toast/Toast.ts'
import ArticleAudio from '@/pages/article/components/ArticleAudio.vue'
import { MessageBox } from '@/utils/MessageBox.tsx'
import { useSettingStore } from '@/stores/setting.ts'
import { useFetch } from '@vueuse/core'
import { AppEnv, DICT_LIST } from '@/config/env.ts'
import { detail } from '@/apis'
import BaseIcon from '@/components/BaseIcon.vue'
import Switch from '@/components/base/Switch.vue'

const runtimeStore = useRuntimeStore()
const settingStore = useSettingStore()
const base = useBaseStore()
const router = useRouter()
const route = useRoute()
const { nav } = useNav()

let isEdit = $ref(false)
let isAdd = $ref(false)
let loading = $ref(false)
let studyLoading = $ref(false)

let selectArticle: Article = $ref(getDefaultArticle({ id: -1 }))

// 计算当前选中文章的索引
const currentArticleIndex = computed(() => {
  return runtimeStore.editDict.articles.findIndex(article => article.id === selectArticle.id)
})

// 处理播放下一个音频
const handlePlayNext = (nextArticle: Article) => {
  selectArticle = nextArticle
}

function handleCheckedChange(val) {
  selectArticle = val.item
}

async function startPractice() {
  let sbook = runtimeStore.editDict
  if (!sbook.articles.length) {
    return Toast.warning('没有文章可学习！')
  }
  studyLoading = true
  await base.changeBook(sbook)
  studyLoading = false

  window.umami?.track('startStudyArticle', {
    name: sbook.name,
    custom: sbook.custom,
    complete: sbook.complete,
    s: `name:${sbook.name},index:${sbook.lastLearnIndex},title:${sbook.articles[sbook.lastLearnIndex].title}`,
  })
  nav('/practice-articles/' + sbook.id)
}

const showBookDetail = computed(() => {
  return !(isAdd || isEdit)
})

async function init() {
  if (route.query?.isAdd) {
    isAdd = true
    runtimeStore.editDict = getDefaultDict()
  } else {
    if (!runtimeStore.editDict.id) {
      await router.push('/articles')
    } else {
      if (
        !runtimeStore.editDict?.articles?.length &&
        !runtimeStore.editDict?.custom &&
        ![DictId.articleCollect].includes(runtimeStore.editDict.en_name || runtimeStore.editDict.id) &&
        !runtimeStore.editDict?.is_default
      ) {
        loading = true
        let r = await _getDictDataByUrl(runtimeStore.editDict, DictType.article)
        runtimeStore.editDict = r
      }

      if (base.article.bookList.find(book => book.id === runtimeStore.editDict.id)) {
        if (AppEnv.CAN_REQUEST) {
          let res = await detail({ id: runtimeStore.editDict.id })
          if (res.success) {
            runtimeStore.editDict.statistics = res.data.statistics
            if (res.data.articles.length) {
              runtimeStore.editDict.articles = res.data.articles
            }
          }
        }
      }
      selectArticle = runtimeStore.editDict.articles[0]
      loading = false
    }
  }
}

onMounted(() => {
  init()

  window.addEventListener('resize', handleResize)
})

watch(
  () => selectArticle.id,
  () => {
    if (displayMode === 'typing-style') {
    }
    positionTranslations()
  }
)

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  if (displayMode === 'typing-style') {
    positionTranslations()
  }
}

function formClose() {
  if (isEdit) isEdit = false
  else router.back()
}

const { data: book_list } = useFetch(resourceWrap(DICT_LIST.ARTICLE.ALL)).json()

function reset() {
  MessageBox.confirm(
    '继续此操作会重置所有文章，并从官方书籍获取最新文章列表，学习记录不会被重置。确认恢复默认吗？',
    '恢复默认',
    async () => {
      let dict = book_list.value.find(v => v.url === runtimeStore.editDict.url) as Dict
      if (dict && dict.id) {
        dict = await _getDictDataByUrl(dict, DictType.article)
        let rIndex = base.article.bookList.findIndex(v => v.id === runtimeStore.editDict.id)
        if (rIndex > -1) {
          let item = base.article.bookList[rIndex]
          item.custom = false
          item.id = dict.id
          item.articles = dict.articles
          if (item.lastLearnIndex >= item.articles.length) {
            item.lastLearnIndex = item.articles.length - 1
          }
          runtimeStore.editDict = item
          Toast.success('恢复成功')
          return
        }
      }
      Toast.error('恢复失败')
    }
  )
}

const currentPractice = $computed(() => {
  if (runtimeStore.editDict.statistics?.length) {
    return runtimeStore.editDict.statistics.filter(v => v.title === selectArticle.title)
  }
  return []
})

const totalSpend = $computed(() => {
  if (runtimeStore.editDict.statistics?.length) {
    return msToHourMinute(total(runtimeStore.editDict.statistics, 'spend'))
  }
  return 0
})

function next() {
  if (!settingStore.articleAutoPlayNext) return
  startPlay = true
  let index = runtimeStore.editDict.articles.findIndex(v => v.id === selectArticle.id)
  if (index > -1) {
    //如果是最后一个
    if (index === runtimeStore.editDict.articles.length - 1) index = -1
    selectArticle = runtimeStore.editDict.articles[index + 1]
  }
}

const list = $computed(() => {
  return [
    getDefaultArticle({
      title: '介绍',
      id: -1,
    }),
  ].concat(runtimeStore.editDict.articles)
})

let showTranslate = $ref(true)
let startPlay = $ref(false)
let displayMode = $ref<'normal' | 'typing-style'>('normal')
let articleWrapperRef = $ref<HTMLElement>()
const isMob = isMobile()

const handleVolumeUpdate = (volume: number) => {
  settingStore.articleSoundVolume = volume
}

const handleSpeedUpdate = (speed: number) => {
  settingStore.articleSoundSpeed = speed
}

// 解析文本为段落和句子结构
interface ParsedSentence {
  text: string
  translate: string
}

interface ParsedParagraph {
  sentences: ParsedSentence[]
}

function parseTextToSections(text: string, textTranslate: string): ParsedParagraph[] {
  if (!text) return []

  // 按段落分割（双换行）
  const textParagraphs = text.split('\n\n').filter(p => p.trim())
  const translateParagraphs = textTranslate ? textTranslate.split('\n\n').filter(p => p.trim()) : []

  // 句子分割正则：按句号、问号、感叹号分割，但保留标点
  const sentenceRegex = /([^.!?]+[.!?]+)/g

  return textParagraphs.map((para, paraIndex) => {
    // 分割句子
    const sentences = para.match(sentenceRegex) || [para]
    const translateSentences = translateParagraphs[paraIndex]
      ? translateParagraphs[paraIndex].match(sentenceRegex) || [translateParagraphs[paraIndex]]
      : []

    return {
      sentences: sentences.map((sent, sentIndex) => ({
        text: sent.trim(),
        translate: translateSentences[sentIndex]?.trim() || '',
      })),
    }
  })
}

// 计算解析后的文章结构
const parsedArticle = $computed(() => {
  if (!selectArticle.text || displayMode !== 'typing-style') return null
  return parseTextToSections(selectArticle.text, selectArticle.textTranslate || '')
})

// 定位翻译到原文下方
function positionTranslations() {
  // if ( isMob || !articleWrapperRef) return
  _nextTick(() => {
    const articleRect = articleWrapperRef.getBoundingClientRect()
    console.log('articleRect',articleRect)
    selectArticle.textTranslate.split('\n\n').forEach((paragraph, paraIndex) => {
      paragraph.split('\n').forEach((sentence, sentIndex) => {
        debugger
        const location = `${paraIndex}-${sentIndex}`
        const sentenceClassName = `.sentence-${location}`
        const sentenceEl = articleWrapperRef?.querySelector(sentenceClassName)
        const translateClassName = `.translate-${location}`
        const translateEl = articleWrapperRef?.querySelector(translateClassName) as HTMLDivElement

        if (sentenceEl && translateEl && sentence) {
          const sentenceRect = sentenceEl.getBoundingClientRect()
          console.log('sentenceRect',sentenceEl.innerText, sentenceRect)
          translateEl.style.opacity = '1'
          translateEl.style.top = sentenceRect.top - articleRect.top + 24 + 'px'
          const spaceEl = translateEl.firstElementChild as HTMLElement
          if (spaceEl) {
            spaceEl.style.width = sentenceRect.left - articleRect.left + 'px'
          }
        }
      })
    })
  }, 300)
}

// 监听显示模式和文章变化，重新定位翻译
watch([() => displayMode, () => selectArticle.id, () => showTranslate], () => {
  if (displayMode === 'typing-style') {
    positionTranslations()
  }
})
</script>

<template>
  <div class="center h-screen">
    <div
      class="mb-0 flex p-space box-border flex-col bg-second w-full 3xl:w-7/10 2xl:w-8/10 xl:w-full 2xl:card 2xl:h-[97vh] h-full"
      v-if="showBookDetail"
    >
      <div class="dict-header flex justify-between items-center relative">
        <div class="flex gap-space">
          <BackIcon class="dict-back z-2" />
          <div class="dict-title text-2xl text-align-center">{{ runtimeStore.editDict.name }}</div>
        </div>
        <div class="dict-actions flex">
          <BaseButton v-if="runtimeStore.editDict.custom && runtimeStore.editDict.url" type="info" @click="reset">
            恢复默认
          </BaseButton>
          <BaseButton :loading="studyLoading || loading" type="info" @click="isEdit = true">编辑</BaseButton>
          <BaseButton type="info" @click="router.push('batch-edit-article')">文章管理</BaseButton>
          <BaseButton :loading="studyLoading || loading" @click="startPractice">学习</BaseButton>
        </div>
      </div>
      <div class="flex flex-1 overflow-hidden mt-3">
        <div class="3xl:w-80 2xl:w-60 xl:w-55 lg:w-50 overflow-auto">
          <ArticleList
            :show-desc="true"
            v-if="runtimeStore.editDict.length"
            @click="handleCheckedChange"
            :list="list"
            :active-id="selectArticle.id"
          >
          </ArticleList>
          <Empty v-else />
        </div>
        <div class="flex-1 shrink-0 pl-4 flex flex-col overflow-hidden">
          <template v-if="selectArticle.id">
            <template v-if="selectArticle.id === -1">
              <div class="flex gap-4 mt-2">
                <img
                  :src="runtimeStore.editDict?.cover"
                  class="w-30 rounded-md"
                  v-if="runtimeStore.editDict?.cover"
                  alt=""
                />
                <div class="text-lg">介绍：{{ runtimeStore.editDict.description }}</div>
              </div>
              <div class="text-base" v-if="totalSpend">总学习时长：{{ totalSpend }}</div>
            </template>
            <template v-else>
              <div class="flex-1 space-y-10 overflow-auto pb-30">
                <div>
                  <div class="flex justify-between items-center relative">
                    <span class="text-3xl">
                      <span class="font-bold">{{ selectArticle.title }}</span>
                      <span class="ml-6 text-2xl" v-if="showTranslate">{{ selectArticle.titleTranslate }}</span>
                    </span>
                    <div class="flex items-center gap-2 mr-4">
                      <BaseIcon
                        :title="`切换显示模式`"
                        @click="displayMode = displayMode === 'normal' ? 'typing-style' : 'normal'"
                      >
                        <IconFluentTextParagraph16Regular v-if="displayMode === 'normal'" />
                        <IconFluentTextAlignLeft16Regular v-else />
                      </BaseIcon>
                      <BaseIcon :title="`开关释义显示`" @click="showTranslate = !showTranslate">
                        <IconFluentTranslate16Regular v-if="showTranslate" />
                        <IconFluentTranslateOff16Regular v-else />
                      </BaseIcon>
                    </div>
                  </div>
                  <div class="mt-2 text-2xl" v-if="selectArticle?.question?.text">
                    Question: {{ selectArticle?.question?.text }}
                  </div>
                </div>

                <template v-if="false">
                  <!--                原文-->
                  <div class="text-2xl en-article-family space-y-5" v-if="selectArticle.text">
                    <!--                  <div class="break-words w-full" v-for="(t, i) in selectArticle.text.split('\n\n')">-->
                    <!--                    <span v-for="(w, j) in t.split('\n')" :class="`sentence-${i}-${j}`" :key="`${i}-${j}`">-->
                    <!--                      &lt;!&ndash;                      <span v-for="(s,n) in w.split(' ')">{{s}}</span>&ndash;&gt;-->
                    <!--                      {{ w }}-->
                    <!--                    </span>-->
                    <!--                  </div>-->
                    <div v-for="t in selectArticle.text.split('\n\n')">{{ t }}</div>
                    <div class="text-right italic">{{ selectArticle?.quote?.text }}</div>
                  </div>

                  <!--                译文-->
                  <template v-if="showTranslate">
                    <div class="line"></div>
                    <div class="text-xl line-height-normal space-y-5" v-if="selectArticle.textTranslate">
                      <div class="mt-2" v-if="selectArticle?.question?.translate">
                        问题: {{ selectArticle?.question?.translate }}
                      </div>
                      <!--                    <div class="break-words w-full" v-for="(t, i) in selectArticle.textTranslate.split('\n\n')">-->
                      <!--                      <span v-for="(w, j) in t.split('\n')" :class="`translate-${i}-${j}`" :key="`${i}-${j}`">-->
                      <!--                        &lt;!&ndash;                      <span v-for="(s,n) in w.split(' ')">{{s}}</span>&ndash;&gt;-->
                      <!--                        {{ w }}-->
                      <!--                      </span>-->
                      <!--                    </div>-->
                      <div v-for="t in selectArticle.textTranslate.split('\n\n')">{{ t }}</div>
                      <div class="text-right italic">{{ selectArticle?.quote?.translate }}</div>
                    </div>
                    <Empty v-else />
                  </template>
                </template>

                <!-- 打字式显示模式 -->
                <template v-if="true">
                  <div class="article-content" :class="[showTranslate && 'tall']" ref="articleWrapperRef">
                    <article>
                      <div class="break-words w-full section" v-for="(t, i) in selectArticle.text.split('\n\n')">
                        <span v-for="(w, j) in t.split('\n')" :class="`sentence-${i}-${j}`" :key="`${i}-${j}`"
                          >{{ w }}
                        </span>
                      </div>
                      <div class="text-right italic" v-if="selectArticle?.quote?.text">
                        {{ selectArticle?.quote?.text }}
                      </div>
                    </article>
                    <div class="translate" v-show="showTranslate">
                      <div
                        class="break-words w-full section"
                        v-for="(t, i) in selectArticle.textTranslate.split('\n\n')"
                      >
                        <div v-for="(w, j) in t.split('\n')" :class="`row translate-${i}-${j}`" :key="`${i}-${j}`">
                          <span class="space"></span>
                          <span>{{ w }}</span>
                        </div>
                      </div>
                      <div class="text-right italic" v-if="selectArticle?.quote?.translate">
                        {{ selectArticle?.quote?.translate }}
                      </div>
                    </div>
                  </div>
                  <!-- 移动端显示翻译 -->
                  <template v-if="isMob && showTranslate">
                    <div
                      class="sentence-translate-mobile"
                      v-for="(paragraph, paraIndex) in parsedArticle"
                      :key="`m-${paraIndex}`"
                    >
                      <div v-for="(sentence, sentIndex) in paragraph.sentences" :key="`${paraIndex}-${sentIndex}`">
                        <div v-if="sentence.translate" class="mt-2">{{ sentence.translate }}</div>
                      </div>
                    </div>
                  </template>
                </template>
                <template v-if="currentPractice.length">
                  <div class="line"></div>
                  <div class="font-family text-base pr-2">
                    <div class="text-2xl font-bold">学习记录</div>
                    <div class="mt-1 mb-3">总学习时长：{{ msToHourMinute(total(currentPractice, 'spend')) }}</div>
                    <div
                      class="item border border-item border-solid mt-2 p-2 bg-[var(--bg-history)] rounded-md flex justify-between"
                      v-for="i in currentPractice"
                    >
                      <span class="color-gray">{{ _dateFormat(i.startDate) }}</span>
                      <span>{{ msToHourMinute(i.spend) }}</span>
                    </div>
                  </div>
                </template>
              </div>
              <div class="border-t-1 border-t-gray-300 border-solid border-0 center gap-2 pt-4">
                <ArticleAudio
                  :article="selectArticle"
                  @update-speed="handleSpeedUpdate"
                  @update-volume="handleVolumeUpdate"
                  :autoplay="settingStore.articleAutoPlayNext && startPlay"
                  @ended="next"
                />
                <div class="flex items-center gap-1">
                  <span>结束后播放下一篇</span>
                  <Switch v-model="settingStore.articleAutoPlayNext" />
                </div>
              </div>
            </template>
          </template>
          <Empty v-else />
        </div>
      </div>
    </div>
    <div class="card mb-0 dict-detail-card" v-else>
      <div class="dict-header flex justify-between items-center relative">
        <BackIcon class="dict-back z-2" @click="isAdd ? $router.back() : (isEdit = false)" />
        <div class="dict-title absolute text-2xl text-align-center w-full">
          {{ runtimeStore.editDict.id ? '修改' : '创建' }}书籍
        </div>
      </div>
      <div class="center">
        <EditBook :is-add="isAdd" :is-book="true" @close="formClose" @submit="isEdit = isAdd = false" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dict-detail-card {
  height: calc(100vh - 3rem);
}

.dict-header {
  gap: 0.5rem;
}

.dict-actions {
  flex-wrap: wrap;
}

// 打字式显示模式样式（复用 TypingArticle 的样式）
$translate-lh: 3.2;
$article-lh: 2.4;

.article-content {
  position: relative;
  color: var(--color-article);
  font-size: 1.6rem;

  &.tall {
    article {
      line-height: $article-lh;
    }
  }

  article {
    word-break: keep-all;
    word-wrap: break-word;
    white-space: pre-wrap;
    font-family: var(--en-article-family);

    .section {
      margin-bottom: 1.5rem;

      .sentence {
        transition: all 0.3s;
        display: inline;
      }
    }
  }

  .translate {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    font-size: 1.2rem;
    line-height: $translate-lh;
    letter-spacing: 0.2rem;
    font-family: var(--zh-article-family);
    font-weight: bold;
    color: #818181;

    .row {
      position: absolute;
      left: 0;
      width: 100%;
      opacity: 0;
      transition: all 0.3s;

      .space {
        transition: all 0.3s;
        display: inline-block;
      }
    }
  }
}

.sentence-translate-mobile {
  display: none;
  margin-top: 0.4rem;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--color-font-3);
  font-family: var(--zh-article-family);
  word-break: break-word;
}

@media (max-width: 768px) {
  .dict-detail-card {
    height: calc(100vh - 2rem);
  }

  .dict-header {
    width: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.75rem;
  }

  .dict-header .dict-back {
    align-self: flex-start;
  }

  .dict-header .dict-title {
    position: static !important;
    width: 100%;
  }

  .dict-header .dict-actions {
    width: 100%;
    justify-content: center;
    gap: 0.75rem;

    .base-button {
      flex: 1 0 45%;
      min-width: 8rem;
    }
  }
}

@media (max-width: 480px) {
  .dict-header .dict-actions {
    flex-direction: column;

    .base-button {
      width: 100%;
      min-width: auto;
    }
  }
}

// 移动端适配 - 打字式显示模式
@media (max-width: 768px) {
  .article-content {
    article {
      .section {
        margin-bottom: 1rem;

        .sentence {
          font-size: 1rem;
          line-height: 1.6;
          word-break: break-word;
          margin-bottom: 0.5rem;
        }
      }
    }

    .translate {
      display: none;
    }
  }

  .sentence-translate-mobile {
    display: block;
  }
}

@media (max-width: 480px) {
  .article-content {
    article {
      .section {
        .sentence {
          font-size: 0.9rem;
          line-height: 1.5;
        }
      }
    }
  }

  .sentence-translate-mobile {
    font-size: 0.85rem;
    line-height: 1.35;
  }
}
</style>
```````` ;
