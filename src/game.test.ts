import { describe, expect, it, vi } from 'vitest'
import { chooseMove } from './ai'
import { BLACK, WHITE, candidates, isWinningMove, resultAfterMove, SIZE } from './game'

describe('gomoku rules', () => {
  it('detects wins in each direction including edges and overlines', () => {
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const board = new Uint8Array(SIZE * SIZE)
      const x = dx === -1 ? 5 : 0
      const y = dy === -1 ? 4 : 0
      for (let i = 0; i < 5; i++) board[(y + i * dy) * SIZE + x + i * dx] = BLACK
      expect(isWinningMove(board, (y + 4 * dy) * SIZE + x + 4 * dx, BLACK)).toBe(true)
      expect(isWinningMove(board, (y + 4 * dy) * SIZE + x + 4 * dx, WHITE)).toBe(false)
    }
  })

  it('starts in center and only considers empty nearby positions', () => {
    const board = new Uint8Array(225)
    expect(candidates(board)).toEqual([112])
    board[112] = BLACK
    expect(candidates(board)).not.toContain(112)
    expect(candidates(board)).toContain(113)
    expect(candidates(board)).not.toContain(0)
  })

  it('reports draw on a full board without a win at the last move', () => {
    const board = new Uint8Array(225).fill(BLACK)
    board[112] = WHITE
    expect(resultAfterMove(board, 112, WHITE)).toBe('draw')
  })
})

describe('AI', () => {
  const score = vi.fn(() => 1)
  it('takes an immediate win before blocking', () => {
    const board = new Uint8Array(225)
    for (let i = 0; i < 4; i++) { board[15 + i] = WHITE; board[45 + i] = BLACK }
    expect(chooseMove(board, WHITE, 'hard', score)).toBe(19)
  })
  it('blocks the opponent immediate win on every level', () => {
    const board = new Uint8Array(225)
    for (let i = 0; i < 4; i++) board[15 + i] = BLACK
    for (const level of ['easy', 'medium', 'hard'] as const) expect(chooseMove(board, WHITE, level, score)).toBe(19)
  })
})
