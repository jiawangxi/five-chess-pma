/**
 * 游戏音效管理系统
 * 基于 Web Audio API 实现程序化音效生成
 * 避免外部音频文件依赖，提高加载效率
 */

// 音效配置接口
interface SoundEffect {
  frequency: number | number[]
  duration: number
  type: OscillatorType
  volume?: number
}

interface PlayOptions {
  pitch?: number
  volume?: number
}

// 音效管理器实现
export class SoundManager {
  private audioContext: AudioContext | null = null
  private isEnabled = true
  private backgroundMusicEnabled = true
  private backgroundAudio: AudioBufferSourceNode | null = null
  private masterGain: GainNode | null = null
  
  // 音效配置 - 基于DTMF音调的棋类游戏音效
  private soundConfig: Record<string, SoundEffect> = {
    // 黑棋落子音效 - 低沉稳重 (C5)
    placeBlack: {
      frequency: 523.25,
      duration: 0.15,
      type: 'sine' as OscillatorType,
      volume: 0.4
    },
    // 白棋落子音效 - 清脆明亮 (G5) 
    placeWhite: {
      frequency: 783.99,
      duration: 0.15,
      type: 'sine' as OscillatorType,
      volume: 0.4
    },
    // 游戏胜利音效 - 上行三和弦
    gameWin: {
      frequency: [523.25, 659.25, 783.99],  // C-E-G
      duration: 0.8,
      type: 'sine' as OscillatorType,
      volume: 0.6
    },
    // 按钮点击音效
    buttonClick: {
      frequency: 800,
      duration: 0.1,
      type: 'square' as OscillatorType,
      volume: 0.3
    },
    // 悔棋音效
    undo: {
      frequency: [659.25, 523.25],  // E-C下行
      duration: 0.3,
      type: 'triangle' as OscillatorType,
      volume: 0.4
    },
    // 游戏开始音效
    gameStart: {
      frequency: [261.63, 329.63, 392.00], // C-E-G上行
      duration: 0.6,
      type: 'sine' as OscillatorType,
      volume: 0.5
    },
    // 错误音效
    error: {
      frequency: 200,
      duration: 0.2,
      type: 'sawtooth' as OscillatorType,
      volume: 0.3
    }
  }

  // 初始化音效系统
  async init(): Promise<void> {
    try {
      // 创建AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // 创建主音量控制
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.value = 0.3 // 设置整体音量

      console.log('? 音效系统初始化成功')
    } catch (error) {
      console.error('音效系统初始化失败:', error)
    }
  }

  // 播放音效
  playSound(name: string, options: PlayOptions = {}): void {
    if (!this.isEnabled || !this.audioContext || !this.masterGain) {
      return
    }

    const config = this.soundConfig[name]
    if (!config) {
      console.warn(`未找到音效配置: ${name}`)
      return
    }

    const { pitch = 1, volume = 1 } = options
    const finalVolume = (config.volume || 0.5) * volume

    try {
      if (Array.isArray(config.frequency)) {
        // 播放和弦或序列音效
        this.playChord(config.frequency, config, finalVolume, pitch)
      } else {
        // 播放单音
        this.playTone(config.frequency, config, finalVolume, pitch)
      }
    } catch (error) {
      console.error(`播放音效失败 (${name}):`, error)
    }
  }

  // 播放单音
  private playTone(frequency: number, config: SoundEffect, volume: number, pitch: number): void {
    if (!this.audioContext || !this.masterGain) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.type = config.type
    oscillator.frequency.setValueAtTime(frequency * pitch, this.audioContext.currentTime)
    
    // 连接音频节点
    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)
    
    // 设置音量包络（避免爆音）
    const now = this.audioContext.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01) // 快速淡入
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration) // 自然衰减
    
    // 播放和停止
    oscillator.start(now)
    oscillator.stop(now + config.duration)
  }

  // 播放和弦
  private playChord(frequencies: number[], config: SoundEffect, volume: number, pitch: number): void {
    if (!this.audioContext || !this.masterGain) return

    const chordVolume = volume / frequencies.length // 避免音量叠加过大

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, config, chordVolume, pitch)
      }, index * 150) // 和弦音符间隔150ms
    })
  }

  // 播放背景音乐（程序化生成）
  playBackgroundMusic(): void {
    if (!this.backgroundMusicEnabled || !this.audioContext || !this.masterGain) {
      return
    }

    try {
      this.stopBackgroundMusic() // 停止当前背景音乐
      
      // 生成简单的背景音乐
      this.generateBackgroundMusic()
      
      console.log('? 开始播放背景音乐')
    } catch (error) {
      console.error('播放背景音乐失败:', error)
    }
  }

  // 生成程序化背景音乐
  private generateBackgroundMusic(): void {
    if (!this.audioContext || !this.masterGain) return

    // 简单的C大调音阶循环
    const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25] // C D E F G A B C
    const beatDuration = 1.0 // 每个音符1秒
    
    const playMelodyLoop = (startTime: number) => {
      melody.forEach((frequency, index) => {
        const noteTime = startTime + index * beatDuration
        
        const oscillator = this.audioContext!.createOscillator()
        const gainNode = this.audioContext!.createGain()
        
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency * 0.5, noteTime) // 低八度
        
        oscillator.connect(gainNode)
        gainNode.connect(this.masterGain!)
        
        // 设置音量包络
        gainNode.gain.setValueAtTime(0, noteTime)
        gainNode.gain.linearRampToValueAtTime(0.05, noteTime + 0.1)  // 淡入
        gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + beatDuration - 0.1) // 淡出
        
        oscillator.start(noteTime)
        oscillator.stop(noteTime + beatDuration)
      })
      
      // 循环播放
      if (this.backgroundMusicEnabled) {
        const nextLoopTime = startTime + melody.length * beatDuration
        setTimeout(() => {
          if (this.backgroundMusicEnabled && this.audioContext) {
            playMelodyLoop(this.audioContext.currentTime)
          }
        }, (nextLoopTime - this.audioContext!.currentTime) * 1000)
      }
    }
    
    playMelodyLoop(this.audioContext.currentTime)
  }

  // 停止背景音乐
  stopBackgroundMusic(): void {
    this.backgroundMusicEnabled = false
    if (this.backgroundAudio) {
      try {
        this.backgroundAudio.stop()
        this.backgroundAudio = null
      } catch (error) {
        // 忽略停止错误
      }
    }
    console.log('? 停止背景音乐')
  }

  // 设置音效开关
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.log(`? 音效${enabled ? '开启' : '关闭'}`)
  }

  // 设置背景音乐开关
  setBackgroundMusicEnabled(enabled: boolean): void {
    this.backgroundMusicEnabled = enabled
    if (!enabled) {
      this.stopBackgroundMusic()
    } else {
      this.playBackgroundMusic()
    }
  }

  // 获取音效状态
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      backgroundMusicEnabled: this.backgroundMusicEnabled,
      contextState: this.audioContext?.state || 'closed'
    }
  }

  // 清理资源
  cleanup(): void {
    this.stopBackgroundMusic()
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    console.log('? 音效系统已清理')
  }
}

// 导出单例实例
export const soundManager = new SoundManager()