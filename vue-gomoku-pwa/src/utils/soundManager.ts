/**
 * 游戏音效管理系统
 * 提供各种游戏音效的播放、控制和管理功能
 */

export interface SoundConfig {
  volume: number // 0-1
  enabled: boolean
  backgroundMusic: boolean
  soundEffects: boolean
}

export interface AudioAsset {
  name: string
  url: string
  audio?: HTMLAudioElement
  loaded: boolean
  loop?: boolean
  volume?: number
}

export class SoundManager {
  private static instance: SoundManager
  private config: SoundConfig
  private audioAssets: Map<string, AudioAsset> = new Map()
  private currentBgMusic: HTMLAudioElement | null = null
  private audioContext: AudioContext | null = null
  private masterGainNode: GainNode | null = null

  // 音效资源定义（使用Web Audio API生成的程序音效）
  private readonly soundDefinitions = {
    // 落子音效
    placePiece: { frequency: 440, duration: 0.1, type: 'click' },
    placeBlack: { frequency: 330, duration: 0.15, type: 'soft' },
    placeWhite: { frequency: 550, duration: 0.15, type: 'soft' },
    
    // 游戏状态音效
    gameWin: { frequency: [523, 659, 784], duration: 0.8, type: 'melody' },
    gameStart: { frequency: 220, duration: 0.3, type: 'start' },
    undoMove: { frequency: 200, duration: 0.2, type: 'undo' },
    
    // UI音效
    buttonClick: { frequency: 300, duration: 0.1, type: 'ui' },
    notification: { frequency: 800, duration: 0.2, type: 'alert' },
    
    // 背景音乐（程序生成的环境音）
    ambientBg: { frequency: [110, 165, 220], duration: -1, type: 'ambient' }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  constructor() {
    this.config = this.loadConfig()
    this.initAudioContext()
    this.generateAudioAssets()
  }

  /**
   * 初始化音频上下文
   */
  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGainNode = this.audioContext.createGain()
      this.masterGainNode.connect(this.audioContext.destination)
      this.updateMasterVolume()
    } catch (error) {
      console.warn('音频上下文初始化失败:', error)
    }
  }

  /**
   * 生成程序音效
   */
  private generateAudioAssets() {
    if (!this.audioContext) return

    Object.entries(this.soundDefinitions).forEach(([name, config]) => {
      const audioBuffer = this.generateSound(config)
      if (audioBuffer) {
        this.audioAssets.set(name, {
          name,
          url: '',
          audio: this.createAudioFromBuffer(audioBuffer),
          loaded: true,
          loop: config.duration === -1,
          volume: config.volume || 1
        })
      }
    })
  }

  /**
   * 根据配置生成音效
   */
  private generateSound(config: any): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const duration = config.duration > 0 ? config.duration : 2 // 背景音乐2秒循环
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    switch (config.type) {
      case 'click':
        this.generateClick(data, config.frequency, sampleRate)
        break
      case 'soft':
        this.generateSoftTone(data, config.frequency, sampleRate, duration)
        break
      case 'melody':
        this.generateMelody(data, config.frequency, sampleRate, duration)
        break
      case 'start':
        this.generateStartSound(data, config.frequency, sampleRate, duration)
        break
      case 'undo':
        this.generateUndoSound(data, config.frequency, sampleRate, duration)
        break
      case 'ui':
        this.generateUISound(data, config.frequency, sampleRate)
        break
      case 'alert':
        this.generateAlert(data, config.frequency, sampleRate, duration)
        break
      case 'ambient':
        this.generateAmbient(data, config.frequency, sampleRate, duration)
        break
    }

    return buffer
  }

  /**
   * 生成点击音效
   */
  private generateClick(data: Float32Array, frequency: number, sampleRate: number) {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-t * 50) // 快速衰减
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3
    }
  }

  /**
   * 生成柔和音效（落子音）
   */
  private generateSoftTone(data: Float32Array, frequency: number, sampleRate: number, duration: number) {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const envelope = Math.sin(Math.PI * t / duration) * Math.exp(-t * 3)
      const harmonics = Math.sin(2 * Math.PI * frequency * t) * 0.7 +
                       Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3
      data[i] = harmonics * envelope * 0.4
    }
  }

  /**
   * 生成获胜旋律
   */
  private generateMelody(data: Float32Array, frequencies: number[], sampleRate: number, duration: number) {
    const noteLength = duration / frequencies.length
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const noteIndex = Math.floor(t / noteLength)
      const noteTime = t % noteLength
      const frequency = frequencies[noteIndex] || frequencies[frequencies.length - 1]
      
      const envelope = Math.sin(Math.PI * noteTime / noteLength) * 0.8
      data[i] = Math.sin(2 * Math.PI * frequency * noteTime) * envelope * 0.5
    }
  }

  /**
   * 生成开始游戏音效
   */
  private generateStartSound(data: Float32Array, frequency: number, sampleRate: number, duration: number) {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const freq = frequency * (1 + t * 2) // 上升音调
      const envelope = (1 - t / duration) * Math.sin(Math.PI * t / duration)
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4
    }
  }

  /**
   * 生成悔棋音效
   */
  private generateUndoSound(data: Float32Array, frequency: number, sampleRate: number, duration: number) {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const freq = frequency * (2 - t * 2) // 下降音调
      const envelope = Math.exp(-t * 8) * Math.sin(Math.PI * t / duration)
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3
    }
  }

  /**
   * 生成UI音效
   */
  private generateUISound(data: Float32Array, frequency: number, sampleRate: number) {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-t * 30)
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.2
    }
  }

  /**
   * 生成提醒音效
   */
  private generateAlert(data: Float32Array, frequency: number, sampleRate: number, duration: number) {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const beep = Math.sin(2 * Math.PI * frequency * t)
      const modulation = Math.sin(2 * Math.PI * 5 * t) * 0.5 + 0.5 // 5Hz调制
      const envelope = Math.sin(Math.PI * t / duration)
      data[i] = beep * modulation * envelope * 0.4
    }
  }

  /**
   * 生成环境音乐
   */
  private generateAmbient(data: Float32Array, frequencies: number[], sampleRate: number, duration: number) {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      let sample = 0
      
      frequencies.forEach((freq, index) => {
        const phase = 2 * Math.PI * freq * t + index * Math.PI / 3
        const volume = 0.15 / frequencies.length
        sample += Math.sin(phase) * volume
      })
      
      // 添加轻微的噪音纹理
      const noise = (Math.random() - 0.5) * 0.02
      data[i] = sample + noise
    }
  }

  /**
   * 从AudioBuffer创建音频元素
   */
  private createAudioFromBuffer(buffer: AudioBuffer): HTMLAudioElement {
    // 创建一个虚拟的音频元素，实际播放使用Web Audio API
    const audio = new Audio()
    audio.preload = 'auto'
    return audio
  }

  /**
   * 播放音效
   */
  async playSound(soundName: string, options?: { volume?: number; pitch?: number }): Promise<void> {
    if (!this.config.enabled || !this.config.soundEffects) return
    if (!this.audioContext || !this.masterGainNode) return

    const asset = this.audioAssets.get(soundName)
    if (!asset || !asset.loaded) return

    try {
      // 确保音频上下文处于运行状态
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      const buffer = await this.getSoundBuffer(soundName)
      if (!buffer) return

      // 创建音频源
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()
      
      source.buffer = buffer
      
      // 设置音量
      const volume = (options?.volume ?? asset.volume ?? 1) * this.config.volume
      gainNode.gain.value = volume

      // 设置音调（可选）
      if (options?.pitch) {
        source.playbackRate.value = options.pitch
      }

      // 连接音频节点
      source.connect(gainNode)
      gainNode.connect(this.masterGainNode)

      // 播放
      source.start()

      console.log(`? 播放音效: ${soundName}`)
    } catch (error) {
      console.warn(`音效播放失败 (${soundName}):`, error)
    }
  }

  /**
   * 获取音效缓冲区
   */
  private async getSoundBuffer(soundName: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null

    // 重新生成音效缓冲区
    const config = this.soundDefinitions[soundName as keyof typeof this.soundDefinitions]
    if (!config) return null

    return this.generateSound(config)
  }

  /**
   * 播放背景音乐
   */
  async playBackgroundMusic(): Promise<void> {
    if (!this.config.enabled || !this.config.backgroundMusic) return
    if (!this.audioContext || !this.masterGainNode) return

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      const buffer = await this.getSoundBuffer('ambientBg')
      if (!buffer) return

      // 停止当前背景音乐
      this.stopBackgroundMusic()

      // 创建循环音频源
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()
      
      source.buffer = buffer
      source.loop = true
      
      gainNode.gain.value = this.config.volume * 0.3 // 背景音乐音量较低
      
      source.connect(gainNode)
      gainNode.connect(this.masterGainNode)
      
      source.start()
      
      // 保存引用以便控制
      this.currentBgMusic = source as any
      
      console.log('? 开始播放背景音乐')
    } catch (error) {
      console.warn('背景音乐播放失败:', error)
    }
  }

  /**
   * 停止背景音乐
   */
  stopBackgroundMusic(): void {
    if (this.currentBgMusic) {
      try {
        (this.currentBgMusic as any).stop()
      } catch (error) {
        // 忽略停止时的错误
      }
      this.currentBgMusic = null
      console.log('? 停止背景音乐')
    }
  }

  /**
   * 更新主音量
   */
  private updateMasterVolume(): void {
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.config.volume
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume))
    this.updateMasterVolume()
    this.saveConfig()
  }

  /**
   * 启用/禁用音效
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    if (!enabled) {
      this.stopBackgroundMusic()
    }
    this.saveConfig()
  }

  /**
   * 启用/禁用背景音乐
   */
  setBackgroundMusicEnabled(enabled: boolean): void {
    this.config.backgroundMusic = enabled
    if (enabled) {
      this.playBackgroundMusic()
    } else {
      this.stopBackgroundMusic()
    }
    this.saveConfig()
  }

  /**
   * 启用/禁用音效
   */
  setSoundEffectsEnabled(enabled: boolean): void {
    this.config.soundEffects = enabled
    this.saveConfig()
  }

  /**
   * 获取当前配置
   */
  getConfig(): SoundConfig {
    return { ...this.config }
  }

  /**
   * 加载音效配置
   */
  private loadConfig(): SoundConfig {
    try {
      const saved = localStorage.getItem('gomoku_sound_config')
      if (saved) {
        return { ...this.getDefaultConfig(), ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('加载音效配置失败:', error)
    }
    return this.getDefaultConfig()
  }

  /**
   * 保存音效配置
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('gomoku_sound_config', JSON.stringify(this.config))
    } catch (error) {
      console.warn('保存音效配置失败:', error)
    }
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): SoundConfig {
    return {
      volume: 0.7,
      enabled: true,
      backgroundMusic: true,
      soundEffects: true
    }
  }

  /**
   * 预加载所有音效（用户交互后调用）
   */
  async preloadSounds(): Promise<void> {
    if (!this.audioContext) return

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      console.log('? 音效系统已就绪')
    } catch (error) {
      console.warn('音效预加载失败:', error)
    }
  }

  /**
   * 获取音效系统状态
   */
  getStatus() {
    return {
      initialized: !!this.audioContext,
      contextState: this.audioContext?.state,
      assetsLoaded: this.audioAssets.size,
      config: this.config,
      backgroundMusicPlaying: !!this.currentBgMusic
    }
  }
}

// 导出单例实例
export const soundManager = SoundManager.getInstance()