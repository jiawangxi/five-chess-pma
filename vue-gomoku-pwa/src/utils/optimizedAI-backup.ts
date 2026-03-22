/**
 * ������������AI����
 * ʵ��Minimax�㷨 + Alpha-Beta��֦ + ���ʽ�Ż�
 */

export interface AIConfig {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  maxDepth: number
  maxThinkTime: number // ���˼��ʱ�䣨���룩
  enableOpening: boolean
  randomFactor: number // 0-1�����������
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
  
  // �������ֱ�
  private readonly PATTERNS = {
    // ����
    FIVE: 100000,
    // ����
    LIVE_FOUR: 10000,
    // ����
    RUSH_FOUR: 1000,
    // ����
    LIVE_THREE: 1000,
    // ����
    SLEEP_THREE: 100,
    // ���
    LIVE_TWO: 100,
    // �߶�
    SLEEP_TWO: 10,
    // ��һ
    LIVE_ONE: 10
  }

  private config: AIConfig
  private nodesSearched = 0
  private startTime = 0
  private transpositionTable = new Map<string, { score: number; depth: number; flag: 'exact' | 'lowerbound' | 'upperbound' }>()
  
  // ���ֿ�
  private readonly openingMoves = [
    [7, 7], // ��Ԫ
    [7, 8], [8, 7], [6, 7], [7, 6], // ��Ԫ��Χ
    [8, 8], [6, 6], [8, 6], [6, 8]  // �Խ�
  ]

  constructor(config: AIConfig) {
    this.config = config
  }

  /**
   * ��ȡ����߷�
   */
  async getBestMove(board: (string | null)[][], player: 'black' | 'white'): Promise<MoveResult> {
    this.startTime = Date.now()
    this.nodesSearched = 0
    this.transpositionTable.clear()

    // ����ǿ��֣�ʹ�ÿ��ֿ�
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

    // ��ȡ��ѡλ��
    const candidates = this.generateCandidates(board, player)
    if (candidates.length === 0) {
      throw new Error('�޿���λ��')
    }

    // ���ֻ��һ����ѡλ��
    if (candidates.length === 1) {
      return {
        position: candidates[0],
        score: 0,
        nodesSearched: 1,
        thinkTime: Date.now() - this.startTime,
        bestLine: [candidates[0]]
      }
    }

    // ���������
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
        
        // ����ҵ���ʤ�߷���ֱ�ӷ���
        if (Math.abs(bestScore) >= this.PATTERNS.FIVE) {
          break
        }
      }
    }

    // ��������
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
   * ��ʱ�����Ƶ�����
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

      // ģ������
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
      
      // ��������
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
   * Minimax�㷨 + Alpha-Beta��֦
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

    // ���ʱ������
    if (Date.now() - this.startTime > this.config.maxThinkTime) {
      return this.evaluateBoard(board, aiPlayer)
    }

    // �����Ϸ����
    const winner = this.checkWinner(board)
    if (winner) {
      return winner === aiPlayer ? this.PATTERNS.FIVE : -this.PATTERNS.FIVE
    }

    // �����������
    if (depth <= 0) {
      return this.evaluateBoard(board, aiPlayer)
    }

    // �û������
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

    const candidates = this.generateCandidates(board, currentPlayer, 8) // ���ƺ�ѡ����
    
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
          break // Beta��֦
        }
      }
      
      // �洢���û���
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
          break // Alpha��֦
        }
      }
      
      // �洢���û���
      this.storeInTranspositionTable(boardKey, minEval, depth, alpha, beta)
      return minEval
    }
  }

  /**
   * ���ɺ�ѡλ��
   */
  private generateCandidates(
    board: (string | null)[][],
    player: 'black' | 'white',
    maxCandidates = 15
  ): Position[] {
    const candidates: Position[] = []
    const visited = new Set<string>()
    const opponent = player === 'black' ? 'white' : 'black'

    // ���ȼ��ؼ���вλ��
    const threatCandidates = this.findThreatPositions(board, player, opponent)
    
    // Ȼ��������������Χ��λ��
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      for (let j = 0; j < this.BOARD_SIZE; j++) {
        if (board[i][j] !== null) {
          // �����Χ��Χ����
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

    // �ϲ���в��ѡλ��
    for (const threat of threatCandidates) {
      const key = `${threat.row},${threat.col}`
      if (!visited.has(key)) {
        candidates.push(threat)
      }
    }

    // ���û�к�ѡλ�ã������̣�����������λ��
    if (candidates.length === 0) {
      return [{ row: 7, col: 7 }]
    }

    // ���������򣬷�����Ѻ�ѡ
    return candidates
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, maxCandidates)
  }

  /**
   * ������вλ��
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
        
        // ������λ�ö��ҷ�����в��ֵ
        const myThreat = this.evaluatePosition(board, i, j, player)
        // ������λ�öԶ��ֵ���в��ֵ
        const oppThreat = this.evaluatePosition(board, i, j, opponent)
        
        // ����ǹؼ�λ�ã������ѡ
        if (myThreat >= this.PATTERNS.LIVE_THREE || oppThreat >= this.PATTERNS.LIVE_THREE) {
          const score = Math.max(myThreat, oppThreat * 1.2) // ������΢��ҪһЩ
          threats.push({ row: i, col: j, score })
        }
      }
    }
    
    return threats.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 8)
  }

  /**
   * ������������
   */
  private evaluateBoard(board: (string | null)[][], player: 'black' | 'white'): number {
    const opponent = player === 'black' ? 'white' : 'black'
    
    let myScore = 0
    let oppScore = 0

    // ��������λ��
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
   * ��������λ�õķ���
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
      [1, 0], [0, 1], [1, 1], [1, -1] // ˮƽ����ֱ���Խ���
    ]

    // �ȼ���Ƿ���������ʤ����ֹ���ֻ�ʤ
    for (const [dx, dy] of directions) {
      // ����Լ�����в
      const myThreat = this.checkThreat(board, row, col, dx, dy, player)
      if (myThreat >= this.PATTERNS.FIVE) {
        return this.PATTERNS.FIVE // ������ʤ
      }
      if (myThreat >= this.PATTERNS.LIVE_FOUR) {
        totalScore += myThreat * 2 // ǿ������
      }

      // �����ֵ���в
      const oppThreat = this.checkThreat(board, row, col, dx, dy, opponent)
      if (oppThreat >= this.PATTERNS.LIVE_FOUR) {
        totalScore += oppThreat * 1.5 // �������
      }
    }

    // ��������
    for (const [dx, dy] of directions) {
      const lineScore = this.evaluateLine(board, row, col, dx, dy, player)
      totalScore += lineScore
    }

    // λ��Ȩ�أ�����λ�ø��м�ֵ
    const centerBonus = this.getCenterBonus(row, col)
    totalScore += centerBonus

    return totalScore
  }

  /**
   * �����в�ȼ�
   */
  private checkThreat(
    board: (string | null)[][],
    row: number,
    col: number,
    dx: number,
    dy: number,
    player: 'black' | 'white'
  ): number {
    // ��ʱ��������
    board[row][col] = player
    const threat = this.evaluateLine(board, row, col, dx, dy, player)
    board[row][col] = null // ����
    return threat
  }

  /**
   * ��ȡ����λ�ý���
   */
  private getCenterBonus(row: number, col: number): number {
    const center = 7
    const distance = Math.abs(row - center) + Math.abs(col - center)
    return Math.max(0, 20 - distance * 2)
  }

  /**
   * ����һ�����ϵķ���
   */
  private evaluateLine(
    board: (string | null)[][],
    row: number,
    col: number,
    dx: number,
    dy: number,
    player: 'black' | 'white'
  ): number {
    let count = 1 // ��ǰλ��
    let blocked = 0 // ���赲�ķ�����

    // ������������
    let i = row + dx, j = col + dy
    while (this.isValidPosition(i, j) && board[i][j] === player) {
      count++
      i += dx
      j += dy
    }
    if (!this.isValidPosition(i, j) || board[i][j] !== null) {
      blocked++
    }

    // �򸺷�������
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

    // �������������赲�������
    return this.getPatternScore(count, blocked)
  }

  /**
   * �������ͻ�ȡ����
   */
  private getPatternScore(count: number, blocked: number): number {
    if (count >= 5) return this.PATTERNS.FIVE
    
    if (count === 4) {
      if (blocked === 0) {
        return this.PATTERNS.LIVE_FOUR // ���ģ���ʤ
      } else if (blocked === 1) {
        return this.PATTERNS.RUSH_FOUR // ���ģ���в�ܴ�
      } else {
        return this.PATTERNS.SLEEP_THREE // ˫���Ļ�������
      }
    }
    
    if (count === 3) {
      if (blocked === 0) {
        return this.PATTERNS.LIVE_THREE // ���������γɶ������
      } else if (blocked === 1) {
        return this.PATTERNS.SLEEP_THREE // ���������γɳ���
      } else {
        return this.PATTERNS.SLEEP_TWO // ˫�»�������
      }
    }
    
    if (count === 2) {
      if (blocked === 0) {
        return this.PATTERNS.LIVE_TWO // �����Ǳ���ϴ�
      } else if (blocked === 1) {
        return this.PATTERNS.SLEEP_TWO // �߶�����һ����ֵ
      } else {
        return 1 // ˫�»����ֵ��С
      }
    }
    
    return blocked === 0 ? this.PATTERNS.LIVE_ONE : 1
  }

  /**
   * ��ȡ�����߷�
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
   * ���ʤ������
   */
  private checkWinner(board: (string | null)[][]): 'black' | 'white' | null {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]
    
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      for (let j = 0; j < this.BOARD_SIZE; j++) {
        const player = board[i][j]
        if (!player) continue
        
        for (const [dx, dy] of directions) {
          let count = 1
          
          // ������
          let x = i + dx, y = j + dy
          while (this.isValidPosition(x, y) && board[x][y] === player) {
            count++
            x += dx
            y += dy
          }
          
          // ������
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
   * ��ȡ�����ƶ���
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
   * ���λ���Ƿ���Ч
   */
  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE
  }

  /**
   * ��ȡ���̼�ֵ�������û����
   */
  private getBoardKey(board: (string | null)[][]): string {
    return board.flat().map(cell => cell || '0').join('')
  }

  /**
   * �洢���û���
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
    
    // �����û����С
    if (this.transpositionTable.size > 100000) {
      this.transpositionTable.clear()
    }
  }

  /**
   * ��������
   */
  updateConfig(newConfig: Partial<AIConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * ��ȡAI״̬
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
 * AI����Ԥ��
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

// ��������AIʵ��
export const gomokuAI = new GomokuAI(AIPresets.medium)