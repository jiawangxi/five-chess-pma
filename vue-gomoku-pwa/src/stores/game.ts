import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { GameState, Position, Move, PieceType } from '@/types/game'
import { PieceType as Piece, GameStatus } from '@/types/game'

const BOARD_SIZE = 15

export const useGameStore = defineStore('game', () => {
  // 游戏状态
  const gameState = reactive<GameState>({
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(Piece.Empty)),
    currentPlayer: Piece.Black,
    status: GameStatus.Playing,
    moves: [],
    winner: undefined
  })

  // 初始化棋盘
  function initializeBoard(): void {
    gameState.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(Piece.Empty))
    gameState.currentPlayer = Piece.Black
    gameState.status = GameStatus.Playing
    gameState.moves = []
    gameState.winner = undefined
  }

  // 验证位置是否有效
  function isValidPosition(position: Position): boolean {
    const { row, col } = position
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
  }

  // 验证位置是否为空
  function isEmptyPosition(position: Position): boolean {
    if (!isValidPosition(position)) return false
    return gameState.board[position.row][position.col] === Piece.Empty
  }

  // 落子操作
  function makeMove(position: Position): boolean {
    if (gameState.status !== GameStatus.Playing) return false
    if (!isEmptyPosition(position)) return false

    // 执行落子
    gameState.board[position.row][position.col] = gameState.currentPlayer
    
    // 记录移动
    const move: Move = {
      position,
      piece: gameState.currentPlayer,
      timestamp: Date.now()
    }
    gameState.moves.push(move)

    // 检查游戏结果
    const winner = checkWinner(position)
    if (winner) {
      gameState.winner = winner
      gameState.status = winner === Piece.Black ? GameStatus.BlackWin : GameStatus.WhiteWin
    } else if (checkDraw()) {
      gameState.status = GameStatus.Draw
    } else {
      // 切换玩家
      gameState.currentPlayer = gameState.currentPlayer === Piece.Black ? Piece.White : Piece.Black
    }

    return true
  }

  // 检查胜负
  function checkWinner(lastMove: Position): PieceType | null {
    const { row, col } = lastMove
    const piece = gameState.board[row][col]
    
    // 四个方向：水平、垂直、对角线、反对角线
    const directions = [
      { dr: 0, dc: 1 },   // 水平
      { dr: 1, dc: 0 },   // 垂直
      { dr: 1, dc: 1 },   // 对角线
      { dr: 1, dc: -1 }   // 反对角线
    ]

    for (const { dr, dc } of directions) {
      let count = 1 // 包含当前棋子

      // 正方向计数
      for (let i = 1; i < 5; i++) {
        const newRow = row + dr * i
        const newCol = col + dc * i
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
          if (gameState.board[newRow][newCol] === piece) {
            count++
          } else {
            break
          }
        } else {
          break
        }
      }

      // 负方向计数
      for (let i = 1; i < 5; i++) {
        const newRow = row - dr * i
        const newCol = col - dc * i
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
          if (gameState.board[newRow][newCol] === piece) {
            count++
          } else {
            break
          }
        } else {
          break
        }
      }

      if (count >= 5) {
        return piece
      }
    }

    return null
  }

  // 检查平局
  function checkDraw(): boolean {
    return gameState.moves.length === BOARD_SIZE * BOARD_SIZE
  }

  // 悔棋
  function undoMove(): boolean {
    if (gameState.moves.length === 0) return false

    const lastMove = gameState.moves.pop()!
    gameState.board[lastMove.position.row][lastMove.position.col] = Piece.Empty
    
    // 恢复游戏状态
    gameState.status = GameStatus.Playing
    gameState.winner = undefined
    gameState.currentPlayer = lastMove.piece

    return true
  }

  // 重新开始游戏
  function resetGame(): void {
    initializeBoard()
  }

  // 获取游戏统计信息
  function getGameStats() {
    return {
      totalMoves: gameState.moves.length,
      currentPlayer: gameState.currentPlayer,
      status: gameState.status,
      winner: gameState.winner
    }
  }

  return {
    gameState,
    initializeBoard,
    makeMove,
    undoMove,
    resetGame,
    getGameStats,
    isValidPosition,
    isEmptyPosition
  }
})