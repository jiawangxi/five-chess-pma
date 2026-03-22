// 五子棋游戏类型定义
export enum PieceType {
  Empty = 0,
  Black = 1,
  White = 2
}

export enum GameStatus {
  Playing = 'playing',
  BlackWin = 'black_win',
  WhiteWin = 'white_win',
  Draw = 'draw',
  Paused = 'paused'
}

export interface Position {
  row: number
  col: number
}

export interface Move {
  position: Position
  piece: PieceType
  timestamp: number
}

export interface GameState {
  board: PieceType[][]
  currentPlayer: PieceType
  status: GameStatus
  moves: Move[]
  winner?: PieceType
}