import { defineStore } from 'pinia'
import { WordPracticeStage } from '@/types/types.ts'

export interface PracticeState {
  step: number
  stage: WordPracticeStage
  startDate: number
  spend: number
  total: number
  newWordNumber: number
  reviewWordNumber: number
  writeWordNumber: number
  inputWordNumber: number //当前总输入了多少个单词（不包含跳过）
  wrong: number
}

export const usePracticeStore = defineStore('practice', {
  state: (): PracticeState => {
    return {
      step: 0,
      stage: WordPracticeStage.FollowWriteNewWord,
      spend: 0,
      startDate: Date.now(),
      total: 0,
      newWordNumber: 0,
      reviewWordNumber: 0,
      writeWordNumber: 0,
      inputWordNumber: 0,
      wrong: 0,
    }
  },
})
