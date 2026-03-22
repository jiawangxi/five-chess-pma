import type { Position, PieceType } from '@/types/game'
import { PieceType as Piece } from '@/types/game'
import type { AIConfig } from '@/types/ai'

const BOARD_SIZE = 15

// 评估函数分数
const SCORES = {
  FIVE: 100000,      // 五连
  FOUR_OPEN: 10000,  // 活四
  FOUR_HALF: 1000,   // 冲四
  THREE_OPEN: 1000,  // 活三
  THREE_HALF: 100,   // 眠三
  TWO_OPEN: 100,     // 活二
  TWO_HALF: 10       // 眠二
}

export class GomokuAI {
  private config: AIConfig
  private evaluationCache = new Map<string, number>()

  constructor(config: AIConfig) {
    this.config = config
  }

  // 获取最佳落子位置
  async getBestMove(board: PieceType[][], aiPiece: PieceType): Promise<Position> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      
      // 获取候选位置
      const candidates = this.getCandidatePositions(board)
      
      if (candidates.length === 0) {
        // 如果没有候选位置，选择中心点
        resolve({ row: 7, col: 7 })
        return
      }

      let bestMove = candidates[0]!
      let bestScore = -Infinity

      // 使用 Minimax 算法评估每个候选位置
      for (const candidate of candidates) {
        // 时间限制检查
        if (Date.now() - startTime > this.config.timeLimit) {
          break
        }

        // 模拟落子
        board[candidate.row][candidate.col] = aiPiece
        
        const score = this.minimax(
          board, 
          this.config.depth - 1, 
          false, 
          aiPiece, 
          -Infinity, 
          Infinity,
          startTime
        )
        
        // 撤销落子
        board[candidate.row][candidate.col] = Piece.Empty

        if (score > bestScore) {
          bestScore = score
          bestMove = candidate
        }
      }

      // 添加随机性
      if (this.config.randomness > 0 && Math.random() < this.config.randomness) {
        const goodMoves = candidates.slice(0, Math.min(3, candidates.length))
        bestMove = goodMoves[Math.floor(Math.random() * goodMoves.length)]!
      }

      resolve(bestMove)
    })
  }

  // Minimax 算法实现
  private minimax(
    board: PieceType[][],
    depth: number,
    isMaximizing: boolean,
    aiPiece: PieceType,
    alpha: number,
    beta: number,
    startTime: number
  ): number {
    // 时间限制检查
    if (Date.now() - startTime > this.config.timeLimit) {
      return this.evaluateBoard(board, aiPiece)
    }

    // 检查缓存
    const boardKey = this.getBoardKey(board)
    if (this.evaluationCache.has(boardKey)) {
      return this.evaluationCache.get(boardKey)!
    }

    // 深度限制或游戏结束
    if (depth === 0) {
      const score = this.evaluateBoard(board, aiPiece)
      this.evaluationCache.set(boardKey, score)
      return score
    }

    const candidates = this.getCandidatePositions(board)
    if (candidates.length === 0) {
      return this.evaluateBoard(board, aiPiece)
    }

    const currentPiece = isMaximizing ? aiPiece : (aiPiece === Piece.Black ? Piece.White : Piece.Black)

    if (isMaximizing) {
      let maxEval = -Infinity
      
      for (const candidate of candidates) {
        board[candidate.row][candidate.col] = currentPiece
        
        const evalScore = this.minimax(board, depth - 1, false, aiPiece, alpha, beta, startTime)
        
        board[candidate.row][candidate.col] = Piece.Empty
        
        maxEval = Math.max(maxEval, evalScore)
        alpha = Math.max(alpha, evalScore)
        
        if (beta <= alpha) break // Alpha-Beta 剪枝
      }
      
      return maxEval
    } else {
      let minEval = Infinity
      
      for (const candidate of candidates) {
        board[candidate.row][candidate.col] = currentPiece
        
        const evalScore = this.minimax(board, depth - 1, true, aiPiece, alpha, beta, startTime)
        
        board[candidate.row][candidate.col] = Piece.Empty
        
        minEval = Math.min(minEval, evalScore)
        beta = Math.min(beta, evalScore)
        
        if (beta <= alpha) break // Alpha-Beta 剪枝
      }
      
      return minEval
    }
  }

  // 评估棋盘局面
  private evaluateBoard(board: PieceType[][], aiPiece: PieceType): number {
    const opponentPiece = aiPiece === Piece.Black ? Piece.White : Piece.Black
    
    let aiScore = 0
    let opponentScore = 0

    // 评估所有方向的连子情况
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] !== Piece.Empty) {
          const piece = board[row][col]
          const score = this.evaluatePosition(board, { row, col }, piece)
          
          if (piece === aiPiece) {
            aiScore += score
          } else {
            opponentScore += score
          }
        }
      }
    }

    return aiScore - opponentScore
  }

  // 评估特定位置的分数
  private evaluatePosition(board: PieceType[][], position: Position, piece: PieceType): number {
    let totalScore = 0

    // 四个方向
    const directions = [
      { dr: 0, dc: 1 },   // 水平
      { dr: 1, dc: 0 },   // 垂直
      { dr: 1, dc: 1 },   // 对角线
      { dr: 1, dc: -1 }   // 反对角线
    ]

    for (const direction of directions) {
      const pattern = this.getPattern(board, position, direction, piece)
      totalScore += this.getPatternScore(pattern)
    }

    return totalScore
  }

  // 获取模式字符串
  private getPattern(board: PieceType[][], position: Position, direction: { dr: number, dc: number }, piece: PieceType): string {
    const { row, col } = position
    const { dr, dc } = direction
    
    let pattern = ''
    
    // 向前查找4个位置
    for (let i = -4; i <= 4; i++) {
      const newRow = row + dr * i
      const newCol = col + dc * i
      
      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
        pattern += 'X' // 边界
      } else if (board[newRow][newCol] === piece) {
        pattern += 'O' // 己方棋子
      } else if (board[newRow][newCol] === Piece.Empty) {
        pattern += '_' // 空位
      } else {
        pattern += 'X' // 对方棋子
      }
    }
    
    return pattern
  }

  // 根据模式计算分数
  private getPatternScore(pattern: string): number {
    // 五连
    if (pattern.includes('OOOOO')) return SCORES.FIVE
    
    // 活四
    if (pattern.includes('_OOOO_')) return SCORES.FOUR_OPEN
    
    // 冲四
    if (pattern.includes('XOOOO_') || pattern.includes('_OOOOX')) return SCORES.FOUR_HALF
    
    // 活三
    if (pattern.includes('_OOO_')) return SCORES.THREE_OPEN
    if (pattern.includes('_O_OO_') || pattern.includes('_OO_O_')) return SCORES.THREE_OPEN
    
    // 眠三
    if (pattern.includes('XOOO_') || pattern.includes('_OOOX')) return SCORES.THREE_HALF
    
    // 活二
    if (pattern.includes('_OO_')) return SCORES.TWO_OPEN
    if (pattern.includes('_O_O_')) return SCORES.TWO_OPEN
    
    // 眠二
    if (pattern.includes('XOO_') || pattern.includes('_OOUX')) return SCORES.TWO_HALF
    
    return 0
  }

  // 获取候选落子位置
  private getCandidatePositions(board: PieceType[][]): Position[] {
    const candidates: Position[] = []
    const occupied = new Set<string>()

    // 找到所有已占用位置周围的空位
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] !== Piece.Empty) {
          // 检查周围的8个方向
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const newRow = row + dr
              const newCol = col + dc
              const key = `${newRow}-${newCol}`
              
              if (
                newRow >= 0 && newRow < BOARD_SIZE &&
                newCol >= 0 && newCol < BOARD_SIZE &&
                board[newRow][newCol] === Piece.Empty &&
                !occupied.has(key)
              ) {
                candidates.push({ row: newRow, col: newCol })
                occupied.add(key)
              }
            }
          }
        }
      }
    }

    // 如果没有候选位置，返回中心位置
    if (candidates.length === 0) {
      candidates.push({ row: 7, col: 7 })
    }

    // 按评估分数排序候选位置
    return candidates.sort((a, b) => {
      const scoreA = this.evaluatePosition(board, a, Piece.Black)
      const scoreB = this.evaluatePosition(board, b, Piece.Black)
      return scoreB - scoreA
    }).slice(0, 10) // 限制候选数量
  }

  // 生成棋盘键值用于缓存
  private getBoardKey(board: PieceType[][]): string {
    return board.map(row => row.join('')).join('|')
  }

  // 清除缓存
  public clearCache(): void {
    this.evaluationCache.clear()
  }
}