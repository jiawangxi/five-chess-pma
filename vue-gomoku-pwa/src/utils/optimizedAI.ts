/**
 * 高性能五子棋AI引擎
 * 实现Minimax算法 + Alpha-Beta剪枝 + 启发式优化
 */

export interface AIConfig {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  maxDepth: number
  maxThinkTime: number // 最大思考时间（毫秒）
  enableOpening: boolean
  randomFactor: number // 0-1，随机性因子
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
  
  // 棋型评分表
  private readonly PATTERNS = {
    // 连五
    FIVE: 100000,
    // 活四
    LIVE_FOUR: 10000,
    // 冲四
    RUSH_FOUR: 1000,
    // 活三
    LIVE_THREE: 1000,
    // 眠三
    SLEEP_THREE: 100,
    // 活二
    LIVE_TWO: 100,
    // 眠二
    SLEEP_TWO: 10,
    // 活一
    LIVE_ONE: 10
  }

  private config: AIConfig
  private nodesSearched = 0
  private startTime = 0
  private transpositionTable = new Map<string, { score: number; depth: number; flag: 'exact' | 'lowerbound' | 'upperbound' }>()
  
  // 开局库
  private readonly openingMoves = [
    [7, 7], // 天元
    [7, 8], [8, 7], [6, 7], [7, 6], // 天元周围
    [8, 8], [6, 6], [8, 6], [6, 8]  // 对角
  ]

  constructor(config: AIConfig) {
    this.config = config
  }

  /**
   * 获取最佳走法
   */
  async getBestMove(board: (string | null)[][], player: 'black' | 'white'): Promise<MoveResult> {
    this.startTime = Date.now()
    this.nodesSearched = 0
    this.transpositionTable.clear()

    // 如果是开局，使用开局库
    const moveCount = this.getMoveCount(board)
    if (this.config.enableOpening && moveCount <= 2) {
      const openingMove = this.getOpeningMove(board)
      if (openingMove) {
        return {
          position: openingMove,
          score: 0,
          nodesSearched: 1,
          thinkTime: Date.now() - this.startTime,
          bestLine: [openingMove]
        }
      }
    }

    // 获取候选位置
    const candidates = this.generateCandidates(board, player)
    if (candidates.length === 0) {
      throw new Error('无可用位置')
    }

    // 如果只有一个候选位置
    if (candidates.length === 1) {
      return {
        position: candidates[0],
        score: 0,
        nodesSearched: 1,
        thinkTime: Date.now() - this.startTime,
        bestLine: [candidates[0]]
      }
    }

    // 迭代深化搜索
    let bestMove = candidates[0]
    let bestScore = this.MIN_SCORE
    let bestLine: Position[] = []
    
    for (let depth = 2; depth <= this.config.maxDepth; depth += 2) {
      if (Date.now() - this.startTime > this.config.maxThinkTime) {
        break
      }

      const result = this.searchWithTimeLimit(board, depth, player, candidates)
      if (result) {
        bestMove = result.position
        bestScore = result.score
        bestLine = result.bestLine
        
        // 如果找到必胜走法，直接返回
        if (Math.abs(bestScore) >= this.PATTERNS.FIVE) {
          break
        }
      }
    }

    // 添加随机性
    if (this.config.randomFactor > 0 && Math.random() < this.config.randomFactor) {
      const topCandidates = candidates
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, Math.min(3, candidates.length))
      bestMove = topCandidates[Math.floor(Math.random() * topCandidates.length)]
    }

    return {
      position: bestMove,
      score: bestScore,
      nodesSearched: this.nodesSearched,
      thinkTime: Date.now() - this.startTime,
      bestLine
    }
  }

  /**
   * 带时间限制的搜索
   */
  private searchWithTimeLimit(
    board: (string | null)[][],
    maxDepth: number,
    player: 'black' | 'white',
    candidates: Position[]
  ): MoveResult | null {
    let bestMove = candidates[0]
    let bestScore = this.MIN_SCORE
    let bestLine: Position[] = []

    for (const candidate of candidates) {
      if (Date.now() - this.startTime > this.config.maxThinkTime) {
        return null
      }

      // 模拟走子
      board[candidate.row][candidate.col] = player
      
      const score = this.minimax(
        board,
        maxDepth - 1,
        this.MIN_SCORE,
        this.MAX_SCORE,
        false,
        player === 'black' ? 'white' : 'black',
        player,
        [candidate]
      )
      
      // 撤销走子
      board[candidate.row][candidate.col] = null

      if (score > bestScore) {
        bestScore = score
        bestMove = candidate
        bestLine = [candidate]
      }
    }

    return {
      position: bestMove,
      score: bestScore,
      nodesSearched: this.nodesSearched,
      thinkTime: Date.now() - this.startTime,
      bestLine
    }
  }

  /**
   * Minimax算法 + Alpha-Beta剪枝
   */
  private minimax(
    board: (string | null)[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    currentPlayer: 'black' | 'white',
    aiPlayer: 'black' | 'white',
    line: Position[]
  ): number {
    this.nodesSearched++

    // 检查时间限制
    if (Date.now() - this.startTime > this.config.maxThinkTime) {
      return this.evaluateBoard(board, aiPlayer)
    }

    // 检查游戏结束
    const winner = this.checkWinner(board)
    if (winner) {
      return winner === aiPlayer ? this.PATTERNS.FIVE : -this.PATTERNS.FIVE
    }

    // 到达搜索深度
    if (depth <= 0) {
      return this.evaluateBoard(board, aiPlayer)
    }

    // 置换表查找
    const boardKey = this.getBoardKey(board)
    const cached = this.transpositionTable.get(boardKey)
    if (cached && cached.depth >= depth) {
      if (cached.flag === 'exact') {
        return cached.score
      } else if (cached.flag === 'lowerbound' && cached.score >= beta) {
        return cached.score
      } else if (cached.flag === 'upperbound' && cached.score <= alpha) {
        return cached.score
      }
    }

    const candidates = this.generateCandidates(board, currentPlayer, 8) // 限制候选数量
    
    if (isMaximizing) {
      let maxEval = this.MIN_SCORE
      for (const candidate of candidates) {
        board[candidate.row][candidate.col] = currentPlayer
        
        const eval_score = this.minimax(
          board,
          depth - 1,
          alpha,
          beta,
          false,
          currentPlayer === 'black' ? 'white' : 'black',
          aiPlayer,
          [...line, candidate]
        )
        
        board[candidate.row][candidate.col] = null
        
        maxEval = Math.max(maxEval, eval_score)
        alpha = Math.max(alpha, eval_score)
        
        if (beta <= alpha) {
          break // Beta剪枝
        }
      }
      
      // 存储到置换表
      this.storeInTranspositionTable(boardKey, maxEval, depth, alpha, beta)
      return maxEval
    } else {
      let minEval = this.MAX_SCORE
      for (const candidate of candidates) {
        board[candidate.row][candidate.col] = currentPlayer
        
        const eval_score = this.minimax(
          board,
          depth - 1,
          alpha,
          beta,
          true,
          currentPlayer === 'black' ? 'white' : 'black',
          aiPlayer,
          [...line, candidate]
        )
        
        board[candidate.row][candidate.col] = null
        
        minEval = Math.min(minEval, eval_score)
        beta = Math.min(beta, eval_score)
        
        if (beta <= alpha) {
          break // Alpha剪枝
        }
      }
      
      // 存储到置换表
      this.storeInTranspositionTable(boardKey, minEval, depth, alpha, beta)
      return minEval
    }
  }

  /**
   * 生成候选位置
   */
  private generateCandidates(
    board: (string | null)[][],
    player: 'black' | 'white',
    maxCandidates = 15
  ): Position[] {
    const candidates: Position[] = []
    const visited = new Set<string>()
    const opponent = player === 'black' ? 'white' : 'black'

    // 首先检查关键威胁位置
    const threatCandidates = this.findThreatPositions(board, player, opponent)
    
    // 然后检查已有棋子周围的位置
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      for (let j = 0; j < this.BOARD_SIZE; j++) {
        if (board[i][j] !== null) {
          // 检查周围范围更大
          for (let di = -2; di <= 2; di++) {
            for (let dj = -2; dj <= 2; dj++) {
              if (di === 0 && dj === 0) continue
              
              const ni = i + di
              const nj = j + dj
              const key = `${ni},${nj}`
              
              if (this.isValidPosition(ni, nj) && 
                  board[ni][nj] === null && 
                  !visited.has(key)) {
                visited.add(key)
                const score = this.evaluatePosition(board, ni, nj, player)
                candidates.push({ row: ni, col: nj, score })
              }
            }
          }
        }
      }
    }

    // 合并威胁候选位置
    for (const threat of threatCandidates) {
      const key = `${threat.row},${threat.col}`
      if (!visited.has(key)) {
        candidates.push(threat)
      }
    }

    // 如果没有候选位置（空棋盘），返回中心位置
    if (candidates.length === 0) {
      return [{ row: 7, col: 7 }]
    }

    // 按评分排序，返回最佳候选
    return candidates
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, maxCandidates)
  }

  /**
   * 查找威胁位置
   */
  private findThreatPositions(
    board: (string | null)[][],
    player: 'black' | 'white',
    opponent: 'black' | 'white'
  ): Position[] {
    const threats: Position[] = []
    
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      for (let j = 0; j < this.BOARD_SIZE; j++) {
        if (board[i][j] !== null) continue
        
        // 检查这个位置对我方的威胁价值
        const myThreat = this.evaluatePosition(board, i, j, player)
        // 检查这个位置对对手的威胁价值
        const oppThreat = this.evaluatePosition(board, i, j, opponent)
        
        // 如果是关键位置，加入候选
        if (myThreat >= this.PATTERNS.LIVE_THREE || oppThreat >= this.PATTERNS.LIVE_THREE) {
          const score = Math.max(myThreat, oppThreat * 1.2) // 防守稍微重要一些
          threats.push({ row: i, col: j, score })
        }
      }
    }
    
    return threats.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 8)
  }

  /**
   * 评估整个棋盘
   */
  private evaluateBoard(board: (string | null)[][], player: 'black' | 'white'): number {
    const opponent = player === 'black' ? 'white' : 'black'
    
    let myScore = 0
    let oppScore = 0

    // 评估所有位置
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      for (let j = 0; j < this.BOARD_SIZE; j++) {
        if (board[i][j] === null) continue
        
        const cellPlayer = board[i][j] as 'black' | 'white'
        const positionScore = this.evaluatePosition(board, i, j, cellPlayer)
        
        if (cellPlayer === player) {
          myScore += positionScore
        } else {
          oppScore += positionScore
        }
      }
    }

    return myScore - oppScore
  }

  /**
   * 评估单个位置的分数
   */
  private evaluatePosition(
    board: (string | null)[][],
    row: number,
    col: number,
    player: 'black' | 'white'
  ): number {
    let totalScore = 0
    const opponent = player === 'black' ? 'white' : 'black'
    const directions = [
      [1, 0], [0, 1], [1, 1], [1, -1] // 水平、垂直、对角线
    ]

    // 先检查是否能立即获胜或阻止对手获胜
    for (const [dx, dy] of directions) {
      // 检查自己的威胁
      const myThreat = this.checkThreat(board, row, col, dx, dy, player)
      if (myThreat >= this.PATTERNS.FIVE) {
        return this.PATTERNS.FIVE // 立即获胜
      }
      if (myThreat >= this.PATTERNS.LIVE_FOUR) {
        totalScore += myThreat * 2 // 强化进攻
      }

      // 检查对手的威胁
      const oppThreat = this.checkThreat(board, row, col, dx, dy, opponent)
      if (oppThreat >= this.PATTERNS.LIVE_FOUR) {
        totalScore += oppThreat * 1.5 // 必须防守
      }
    }

    // 正常评分
    for (const [dx, dy] of directions) {
      const lineScore = this.evaluateLine(board, row, col, dx, dy, player)
      totalScore += lineScore
    }

    // 位置权重：中心位置更有价值
    const centerBonus = this.getCenterBonus(row, col)
    totalScore += centerBonus

    return totalScore
  }

  /**
   * 检查威胁等级
   */
  private checkThreat(
    board: (string | null)[][],
    row: number,
    col: number,
    dx: number,
    dy: number,
    player: 'black' | 'white'
  ): number {
    // 临时放置棋子
    board[row][col] = player
    const threat = this.evaluateLine(board, row, col, dx, dy, player)
    board[row][col] = null // 撤销
    return threat
  }

  /**
   * 获取中心位置奖励
   */
  private getCenterBonus(row: number, col: number): number {
    const center = 7
    const distance = Math.abs(row - center) + Math.abs(col - center)
    return Math.max(0, 20 - distance * 2)
  }

  /**
   * 评估一条线上的分数
   */
  private evaluateLine(
    board: (string | null)[][],
    row: number,
    col: number,
    dx: number,
    dy: number,
    player: 'black' | 'white'
  ): number {
    let count = 1 // 当前位置
    let blocked = 0 // 被阻挡的方向数

    // 向正方向搜索
    let i = row + dx, j = col + dy
    while (this.isValidPosition(i, j) && board[i][j] === player) {
      count++
      i += dx
      j += dy
    }
    if (!this.isValidPosition(i, j) || board[i][j] !== null) {
      blocked++
    }

    // 向负方向搜索
    i = row - dx
    j = col - dy
    while (this.isValidPosition(i, j) && board[i][j] === player) {
      count++
      i -= dx
      j -= dy
    }
    if (!this.isValidPosition(i, j) || board[i][j] !== null) {
      blocked++
    }

    // 根据连子数和阻挡情况评分
    return this.getPatternScore(count, blocked)
  }

  /**
   * 根据棋型获取分数
   */
  private getPatternScore(count: number, blocked: number): number {
    if (count >= 5) return this.PATTERNS.FIVE
    
    if (count === 4) {
      if (blocked === 0) {
        return this.PATTERNS.LIVE_FOUR // 活四，必胜
      } else if (blocked === 1) {
        return this.PATTERNS.RUSH_FOUR // 冲四，威胁很大
      } else {
        return this.PATTERNS.SLEEP_THREE // 双冲四基本无用
      }
    }
    
    if (count === 3) {
      if (blocked === 0) {
        return this.PATTERNS.LIVE_THREE // 活三，可形成多个活四
      } else if (blocked === 1) {
        return this.PATTERNS.SLEEP_THREE // 眠三，可形成冲四
      } else {
        return this.PATTERNS.SLEEP_TWO // 双堵基本无用
      }
    }
    
    if (count === 2) {
      if (blocked === 0) {
        return this.PATTERNS.LIVE_TWO // 活二，潜力较大
      } else if (blocked === 1) {
        return this.PATTERNS.SLEEP_TWO // 眠二，有一定价值
      } else {
        return 1 // 双堵活二价值很小
      }
    }
    
    return blocked === 0 ? this.PATTERNS.LIVE_ONE : 1
  }

  /**
   * 获取开局走法
   */
  private getOpeningMove(board: (string | null)[][]): Position | null {
    for (const [row, col] of this.openingMoves) {
      if (board[row][col] === null) {
        return { row, col }
      }
    }
    return null
  }

  /**
   * 检查胜利条件
   */
  private checkWinner(board: (string | null)[][]): 'black' | 'white' | null {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]
    
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      for (let j = 0; j < this.BOARD_SIZE; j++) {
        const player = board[i][j]
        if (!player) continue
        
        for (const [dx, dy] of directions) {
          let count = 1
          
          // 正方向
          let x = i + dx, y = j + dy
          while (this.isValidPosition(x, y) && board[x][y] === player) {
            count++
            x += dx
            y += dy
          }
          
          // 负方向
          x = i - dx
          y = j - dy
          while (this.isValidPosition(x, y) && board[x][y] === player) {
            count++
            x -= dx
            y -= dy
          }
          
          if (count >= 5) {
            return player as 'black' | 'white'
          }
        }
      }
    }
    
    return null
  }

  /**
   * 获取棋盘移动数
   */
  private getMoveCount(board: (string | null)[][]): number {
    let count = 0
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      for (let j = 0; j < this.BOARD_SIZE; j++) {
        if (board[i][j] !== null) count++
      }
    }
    return count
  }

  /**
   * 检查位置是否有效
   */
  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE
  }

  /**
   * 获取棋盘键值（用于置换表）
   */
  private getBoardKey(board: (string | null)[][]): string {
    return board.flat().map(cell => cell || '0').join('')
  }

  /**
   * 存储到置换表
   */
  private storeInTranspositionTable(
    key: string,
    score: number,
    depth: number,
    alpha: number,
    beta: number
  ) {
    let flag: 'exact' | 'lowerbound' | 'upperbound' = 'exact'
    
    if (score <= alpha) {
      flag = 'upperbound'
    } else if (score >= beta) {
      flag = 'lowerbound'
    }
    
    this.transpositionTable.set(key, { score, depth, flag })
    
    // 限制置换表大小
    if (this.transpositionTable.size > 100000) {
      this.transpositionTable.clear()
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AIConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取AI状态
   */
  getStatus() {
    return {
      config: this.config,
      cacheSize: this.transpositionTable.size,
      lastSearchNodes: this.nodesSearched
    }
  }
}

/**
 * AI配置预设
 */
export const AIPresets: Record<string, AIConfig> = {
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
    maxThinkTime: 3000,
    enableOpening: true,
    randomFactor: 0.2
  },
  hard: {
    difficulty: 'hard',
    maxDepth: 6,
    maxThinkTime: 5000,
    enableOpening: true,
    randomFactor: 0.1
  },
  expert: {
    difficulty: 'expert',
    maxDepth: 8,
    maxThinkTime: 10000,
    enableOpening: true,
    randomFactor: 0.05
  }
}

// 导出单例AI实例
export const gomokuAI = new GomokuAI(AIPresets.medium)