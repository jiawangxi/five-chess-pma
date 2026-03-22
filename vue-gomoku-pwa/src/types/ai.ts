// AI 难度级别和配置
export enum AILevel {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard'
}

export interface AIConfig {
  level: AILevel
  depth: number
  timeLimit: number
  randomness: number
}

export const AI_CONFIGS: Record<AILevel, AIConfig> = {
  [AILevel.Easy]: {
    level: AILevel.Easy,
    depth: 2,
    timeLimit: 1000,
    randomness: 0.3
  },
  [AILevel.Medium]: {
    level: AILevel.Medium,
    depth: 4,
    timeLimit: 3000,
    randomness: 0.1
  },
  [AILevel.Hard]: {
    level: AILevel.Hard,
    depth: 6,
    timeLimit: 5000,
    randomness: 0.05
  }
}