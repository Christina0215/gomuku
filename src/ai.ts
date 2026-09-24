import { BLACK, EMPTY, other, candidates, isWinningMove, type Difficulty, type Stone } from './game'

export type ScoreMove = (board: Uint8Array, index: number, player: number) => number

function ranked(board: Uint8Array, player: Stone, score: ScoreMove) {
  const rival = other(player)
  return candidates(board).map(index => {
    const attack = score(board, index, player)
    const defense = score(board, index, rival)
    const x = index % 15
    const y = Math.floor(index / 15)
    return { index, value: attack + defense * 0.92 + (14 - Math.abs(x - 7) - Math.abs(y - 7)) }
  }).sort((a, b) => b.value - a.value)
}

export function chooseMove(board: Uint8Array, player: Stone, difficulty: Difficulty, score: ScoreMove): number {
  const choices = candidates(board)
  if (choices.length === 1) return choices[0]

  // Winning and blocking a win are mandatory at every difficulty.
  const win = choices.find(index => { board[index] = player; const won = isWinningMove(board, index, player); board[index] = EMPTY; return won })
  if (win !== undefined) return win
  const rival = other(player)
  const block = choices.find(index => { board[index] = rival; const won = isWinningMove(board, index, rival); board[index] = EMPTY; return won })
  if (block !== undefined) return block

  const options = ranked(board, player, score)
  if (difficulty === 'easy') return options[Math.floor(Math.random() * Math.min(5, options.length))].index
  if (difficulty === 'medium') return options[0].index

  // Look ahead one reply and discount moves that give the opponent a forcing threat.
  let best = options[0].index
  let bestValue = -Infinity
  for (const option of options.slice(0, 10)) {
    board[option.index] = player
    const replies = ranked(board, rival, score)
    const threat = replies.slice(0, 6).reduce((max, reply) => {
      const immediate = score(board, reply.index, rival)
      return Math.max(max, immediate >= 1_000_000 ? 1_000_000 : reply.value)
    }, 0)
    board[option.index] = EMPTY
    const value = option.value - threat * 0.85
    if (value > bestValue) { bestValue = value; best = option.index }
  }
  return best
}

export function openingPlayer(human: Stone): Stone {
  return human === BLACK ? human : other(human)
}
