export const SIZE = 15
export const EMPTY = 0
export const BLACK = 1
export const WHITE = 2

export type Stone = typeof BLACK | typeof WHITE
export type Cell = typeof EMPTY | Stone
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Result = Stone | 'draw' | null

export function other(player: Stone): Stone {
  return player === BLACK ? WHITE : BLACK
}

export function isWinningMove(board: ArrayLike<number>, index: number, player: Stone): boolean {
  const x = index % SIZE
  const y = Math.floor(index / SIZE)

  for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    let count = 1
    for (const sign of [-1, 1]) {
      let nx = x + dx * sign
      let ny = y + dy * sign
      while (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && board[ny * SIZE + nx] === player) {
        count++
        nx += dx * sign
        ny += dy * sign
      }
    }
    if (count >= 5) return true
  }

  return false
}

export function resultAfterMove(board: ArrayLike<number>, index: number, player: Stone): Result {
  if (isWinningMove(board, index, player)) return player
  return Array.from(board).every(cell => cell !== EMPTY) ? 'draw' : null
}

export function candidates(board: ArrayLike<number>): number[] {
  if (Array.from(board).every(cell => cell === EMPTY)) return [112]

  const choices: number[] = []
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const index = y * SIZE + x
      if (board[index] !== EMPTY) continue
      let near = false
      for (let dy = -2; dy <= 2 && !near; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && board[ny * SIZE + nx] !== EMPTY) {
            near = true
            break
          }
        }
      }
      if (near) choices.push(index)
    }
  }
  return choices
}
