/**
 * 五子棋AI引擎
 * 采用极小极大算法与Alpha-Beta剪枝优化
 */

export interface AIConfig {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master'
  maxDepth: number
  maxThinkTime: number
  enableOpening: boolean
  randomFactor: number
}

export interface Position {
  row: number
  col: number
  score?: number
}

export interface MoveResult {
  position: Position
  score: number
  nodesSearched: number
  thinkTime: number
  bestLine: Position[]
}

export class GomokuAI {
  private readonly BOARD_SIZE = 15
  private readonly MAX_SCORE = 100000
  private readonly MIN_SCORE = -100000
  
  // 棋型评分系统
  private readonly PATTERNS = {
    FIVE: 100000,      // 五连珠 - 获胜
    LIVE_FOUR: 10000,  // 活四 - 必胜
    RUSH_FOUR: 1000,   // 冲四 - 强制应对
    LIVE_THREE: 1000,  // 活三 - 强攻势
    SLEEP_THREE: 100,  // 眠三 - 潜在威胁
    LIVE_TWO: 100,     // 活二 - 发展空间
    SLEEP_TWO: 10,     // 眠二 - 基础连子
    LIVE_ONE: 10       // 单子 - 基础分值
  }

  private config: AIConfig
  private nodesSearched = 0
  private startTime = 0
  private transpositionTable = new Map<string, { 
    score: number
    depth: number
    flag: 'exact' | 'lowerbound' | 'upperbound' 
  }>()
  
  // 开局库 - 天元及其周围的优势位置
  private readonly openingMoves = [
    [7, 7], [7, 8], [8, 7], [6, 7], [7, 6],
    [8, 8], [6, 6], [6, 8], [8, 6], [7, 9],
    [9, 7], [5, 7], [7, 5], [9, 8], [8, 9],
    [6, 5], [5, 6], [9, 6], [6, 9], [5, 8], [8, 5]
  ]

  constructor(difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master' = 'medium') {
    // 根据难度配置AI参数
    const configs: Record<string, AIConfig> = {
      easy: { 
        difficulty: 'easy', 
        maxDepth: 2, 
        maxThinkTime: 1000, 
        enableOpening: true, 
        randomFactor: 0.3 
      },
      medium: { 
        difficulty: 'medium', 
        maxDepth: 4, 
        maxThinkTime: 2000, 
        enableOpening: true, 
        randomFactor: 0.2 
      },
      hard: { 
        difficulty: 'hard', 
        maxDepth: 6, 
        maxThinkTime: 3000, 
        enableOpening: true, 
        randomFactor: 0.1 
      },
      expert: { 
        difficulty: 'expert', 
        maxDepth: 8, 
        maxThinkTime: 5000, 
        enableOpening: true, 
        randomFactor: 0.05 
      },
      master: { 
        difficulty: 'master', 
        maxDepth: 10, 
        maxThinkTime: 8000, 
        enableOpening: true, 
        randomFactor: 0 
      }
    }
    
    this.config = configs[difficulty]
  }

  /**
   * AI下棋主入口
   * @param board 棋盘状态 (0=空, 1=黑棋, 2=白棋)
   * @param isBlack AI是否执黑棋
   * @returns 最佳落子位置及相关信息
   */
  public getBestMove(board: number[][], isBlack: boolean): MoveResult {
    this.startTime = Date.now()
    this.nodesSearched = 0
    this.transpositionTable.clear()
    
    const aiPlayer = isBlack ? 1 : 2
    const moveCount = this.getMoveCount(board)
    
    // 开局阶段使用开局库
    if (this.config.enableOpening && moveCount <= 2) {
      const openingMove = this.getOpeningMove(board, moveCount)
      if (openingMove) {
        return {
          position: { row: openingMove[0], col: openingMove[1] },
          score: 0,
          nodesSearched: 1,
          thinkTime: Date.now() - this.startTime,
          bestLine: []
        }
      }
    }

    // 使用迭代加深搜索
    let bestMove: Position = { row: 7, col: 7 }
    let bestScore = this.MIN_SCORE
    let bestLine: Position[] = []
    
    for (let depth = 1; depth <= this.config.maxDepth; depth++) {
      const result = this.minimax(
        board, 
        depth, 
        this.MIN_SCORE, 
        this.MAX_SCORE, 
        true, 
        aiPlayer
      )
      
      if (result.position) {
        bestMove = result.position
        bestScore = result.score
        bestLine = result.line || []
      }
      
      // 检查时间限制
      if (Date.now() - this.startTime > this.config.maxThinkTime) {
        break
      }
      
      // 如果找到必胜棋，提前结束搜索
      if (Math.abs(result.score) >= this.PATTERNS.FIVE) {
        break
      }
    }
    
    return {
      position: bestMove,
      score: bestScore,
      nodesSearched: this.nodesSearched,
      thinkTime: Date.now() - this.startTime,
      bestLine: bestLine
    }
  }

  /**
   * 极小极大算法核心实现
   */
  private minimax(
    board: number[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiPlayer: number
  ): { position: Position | null; score: number; line?: Position[] } {
    this.nodesSearched++
    
    // 检查时间限制
    if (Date.now() - this.startTime > this.config.maxThinkTime) {
      return { position: null, score: 0 }
    }
    
    // 检查置换表
    const boardHash = this.getBoardHash(board)
    const cached = this.transpositionTable.get(boardHash)
    if (cached && cached.depth >= depth) {
      if (cached.flag === 'exact') {
        return { position: null, score: cached.score }
      } else if (cached.flag === 'lowerbound' && cached.score >= beta) {
        return { position: null, score: cached.score }
      } else if (cached.flag === 'upperbound' && cached.score <= alpha) {
        return { position: null, score: cached.score }
      }
    }
    
    // 检查游戏结束状态
    const winner = this.checkWin(board)
    if (winner !== 0) {
      const score = winner === aiPlayer ? this.PATTERNS.FIVE : -this.PATTERNS.FIVE
      return { position: null, score: score }
    }
    
    // 到达搜索深度限制，返回评估值
    if (depth === 0) {
      const score = this.evaluateBoard(board, aiPlayer)
      return { position: null, score: score }
    }
    
    // 生成候选落子位置
    const candidates = this.generateCandidates(board, aiPlayer)
    if (candidates.length === 0) {
      return { position: null, score: 0 }
    }
    
    let bestPosition: Position | null = null
    let bestScore = isMaximizing ? this.MIN_SCORE : this.MAX_SCORE
    let bestLine: Position[] = []
    let flag: 'exact' | 'lowerbound' | 'upperbound' = 'exact'
    
    for (const candidate of candidates) {
      // 尝试落子
      board[candidate.row][candidate.col] = isMaximizing ? aiPlayer : (3 - aiPlayer)
      
      // 递归搜索
      const result = this.minimax(
        board,
        depth - 1,
        alpha,
        beta,
        !isMaximizing,
        aiPlayer
      )
      
      // 撤销落子
      board[candidate.row][candidate.col] = 0
      
      if (isMaximizing) {
        if (result.score > bestScore) {
          bestScore = result.score
          bestPosition = candidate
          bestLine = [candidate, ...(result.line || [])]
        }
        alpha = Math.max(alpha, result.score)
      } else {
        if (result.score < bestScore) {
          bestScore = result.score
          bestPosition = candidate
          bestLine = [candidate, ...(result.line || [])]
        }
        beta = Math.min(beta, result.score)
      }
      
      // Alpha-Beta剪枝
      if (beta <= alpha) {
        flag = isMaximizing ? 'lowerbound' : 'upperbound'
        break
      }
    }
    
    // 存储到置换表
    this.transpositionTable.set(boardHash, { score: bestScore, depth, flag })
    
    return { position: bestPosition, score: bestScore, line: bestLine }
  }

  /**
   * 生成候选落子位置
   * 优先考虑威胁性强的位置
   */
  private generateCandidates(board: number[][], aiPlayer: number): Position[] {
    const candidates: Position[] = []
    const threats: Position[] = []
    const defenses: Position[] = []
    const attacks: Position[] = []
    const normal: Position[] = []
    
    // 遍历棋盘，寻找有效的落子点
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        if (board[row][col] !== 0) continue
        
        // 检查是否在已有棋子附近（距离2以内）
        if (!this.isNearExistingPiece(board, row, col, 2)) continue
        
        // 评估这个位置的威胁等级
        const threatLevel = this.evaluatePositionThreat(board, row, col, aiPlayer)
        const position: Position = { row, col, score: threatLevel }
        
        if (threatLevel >= this.PATTERNS.LIVE_FOUR) {
          threats.push(position) // 必胜或必防
        } else if (threatLevel >= this.PATTERNS.RUSH_FOUR) {
          defenses.push(position) // 重要防守
        } else if (threatLevel >= this.PATTERNS.LIVE_THREE) {
          attacks.push(position) // 进攻机会
        } else {
          normal.push(position) // 普通位置
        }
      }
    }
    
    // 按威胁等级排序返回候选位置
    threats.sort((a, b) => (b.score || 0) - (a.score || 0))
    defenses.sort((a, b) => (b.score || 0) - (a.score || 0))
    attacks.sort((a, b) => (b.score || 0) - (a.score || 0))
    normal.sort((a, b) => (b.score || 0) - (a.score || 0))
    
    // 限制候选数量以提高搜索效率
    candidates.push(...threats.slice(0, 5))
    candidates.push(...defenses.slice(0, 8))
    candidates.push(...attacks.slice(0, 10))
    candidates.push(...normal.slice(0, 12))
    
    return candidates.slice(0, 20) // 最多返回20个候选位置
  }

  /**
   * 检查位置是否在已有棋子附近
   */
  private isNearExistingPiece(board: number[][], row: number, col: number, distance: number): boolean {
    for (let dr = -distance; dr <= distance; dr++) {
      for (let dc = -distance; dc <= distance; dc++) {
        if (dr === 0 && dc === 0) continue
        const newRow = row + dr
        const newCol = col + dc
        if (newRow >= 0 && newRow < this.BOARD_SIZE && 
            newCol >= 0 && newCol < this.BOARD_SIZE && 
            board[newRow][newCol] !== 0) {
          return true
        }
      }
    }
    return false
  }

  /**
   * 评估位置的威胁等级
   */
  private evaluatePositionThreat(board: number[][], row: number, col: number, aiPlayer: number): number {
    let maxThreat = 0
    
    // 分别评估AI和对手在此位置的威胁
    for (const player of [aiPlayer, 3 - aiPlayer]) {
      board[row][col] = player // 临时放置棋子
      const threat = this.evaluateBoard(board, aiPlayer)
      maxThreat = Math.max(maxThreat, Math.abs(threat))
      board[row][col] = 0 // 撤销
    }
    
    return maxThreat
  }

  /**
   * 棋盘局面评估函数
   */
  private evaluateBoard(board: number[][], aiPlayer: number): number {
    let score = 0
    const opponent = 3 - aiPlayer
    
    // 评估所有方向的连线
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        if (board[row][col] === 0) continue
        
        const player = board[row][col]
        
        // 检查四个方向：水平、垂直、主对角线、反对角线
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
        for (const [dr, dc] of directions) {
          const pattern = this.analyzePattern(board, row, col, dr, dc, player)
          const patternScore = this.getPatternScore(pattern)
          
          if (player === aiPlayer) {
            score += patternScore
          } else {
            score -= patternScore * 1.1 // 防守权重稍高
          }
        }
      }
    }
    
    return score
  }

  /**
   * 分析特定方向的棋型
   */
  private analyzePattern(
    board: number[][], 
    startRow: number, 
    startCol: number, 
    deltaRow: number, 
    deltaCol: number, 
    player: number
  ): { consecutive: number; blocked: number; spaces: number } {
    let consecutive = 1 // 包含起始位置
    let leftBlocked = false
    let rightBlocked = false
    let leftSpaces = 0
    let rightSpaces = 0
    
    // 向左扩展
    let row = startRow - deltaRow
    let col = startCol - deltaCol
    while (row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE) {
      if (board[row][col] === player) {
        consecutive++
      } else if (board[row][col] === 0) {
        leftSpaces++
        if (leftSpaces >= 2) break // 最多考虑2个空位
      } else {
        leftBlocked = true
        break
      }
      row -= deltaRow
      col -= deltaCol
    }
    if (row < 0 || row >= this.BOARD_SIZE || col < 0 || col >= this.BOARD_SIZE) {
      leftBlocked = true
    }
    
    // 向右扩展
    row = startRow + deltaRow
    col = startCol + deltaCol
    while (row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE) {
      if (board[row][col] === player) {
        consecutive++
      } else if (board[row][col] === 0) {
        rightSpaces++
        if (rightSpaces >= 2) break
      } else {
        rightBlocked = true
        break
      }
      row += deltaRow
      col += deltaCol
    }
    if (row < 0 || row >= this.BOARD_SIZE || col < 0 || col >= this.BOARD_SIZE) {
      rightBlocked = true
    }
    
    const blocked = (leftBlocked ? 1 : 0) + (rightBlocked ? 1 : 0)
    const spaces = leftSpaces + rightSpaces
    
    return { consecutive, blocked, spaces }
  }

  /**
   * 根据棋型模式计算分值
   */
  private getPatternScore(pattern: { consecutive: number; blocked: number; spaces: number }): number {
    const { consecutive, blocked, spaces } = pattern
    
    // 五连珠直接获胜
    if (consecutive >= 5) {
      return this.PATTERNS.FIVE
    }
    
    // 四连珠
    if (consecutive === 4) {
      if (blocked === 0) return this.PATTERNS.LIVE_FOUR  // 活四
      if (blocked === 1) return this.PATTERNS.RUSH_FOUR  // 冲四
      return 0 // 双封四无意义
    }
    
    // 三连珠
    if (consecutive === 3) {
      if (blocked === 0) return this.PATTERNS.LIVE_THREE // 活三
      if (blocked === 1 && spaces >= 2) return this.PATTERNS.SLEEP_THREE // 眠三
      return 0
    }
    
    // 二连珠
    if (consecutive === 2) {
      if (blocked === 0) return this.PATTERNS.LIVE_TWO   // 活二
      if (blocked === 1 && spaces >= 3) return this.PATTERNS.SLEEP_TWO // 眠二
      return 0
    }
    
    // 单子
    if (consecutive === 1) {
      if (blocked === 0) return this.PATTERNS.LIVE_ONE
      return 0
    }
    
    return 0
  }

  /**
   * 检查游戏是否结束
   */
  private checkWin(board: number[][]): number {
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        const player = board[row][col]
        if (player === 0) continue
        
        // 检查四个方向
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
        for (const [dr, dc] of directions) {
          let count = 1
          
          // 正方向计数
          let r = row + dr, c = col + dc
          while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && board[r][c] === player) {
            count++
            r += dr
            c += dc
          }
          
          // 反方向计数
          r = row - dr
          c = col - dc
          while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && board[r][c] === player) {
            count++
            r -= dr
            c -= dc
          }
          
          if (count >= 5) return player
        }
      }
    }
    return 0
  }

  /**
   * 获取开局落子
   */
  private getOpeningMove(board: number[][], moveCount: number): [number, number] | null {
    if (moveCount === 0) {
      // 第一步走天元
      return [7, 7]
    } else if (moveCount === 1) {
      // 第二步在天元附近随机选择
      const availableOpening = this.openingMoves.filter(([row, col]) => 
        board[row] && board[row][col] === 0
      )
      if (availableOpening.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(5, availableOpening.length))
        return availableOpening[randomIndex] as [number, number]
      }
    }
    return null
  }

  /**
   * 计算棋盘上的总步数
   */
  private getMoveCount(board: number[][]): number {
    let count = 0
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        if (board[row][col] !== 0) count++
      }
    }
    return count
  }

  /**
   * 生成棋盘哈希值用于置换表
   */
  private getBoardHash(board: number[][]): string {
    return board.map(row => row.join('')).join('|')
  }

  /**
   * 重置AI状态
   */
  public reset(): void {
    this.transpositionTable.clear()
    this.nodesSearched = 0
  }

  /**
   * 获取AI配置信息
   */
  public getConfig(): AIConfig {
    return { ...this.config }
  }
}

// 导出便利函数
export function createAI(difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master' = 'medium'): GomokuAI {
  return new GomokuAI(difficulty)
}

// 兼容性导出
export { GomokuAI as OptimizedGomokuAI }