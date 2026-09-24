import { useEffect, useState } from 'react'
import initWasm, { score_move } from './wasm/gomuku_engine'
import { chooseMove, openingPlayer, type ScoreMove } from './ai'
import { BLACK, EMPTY, SIZE, WHITE, other, resultAfterMove, type Difficulty, type Result, type Stone } from './game'

type Game = { board: Uint8Array; moves: number[]; turn: Stone; result: Result }

const newGame = (human: Stone): Game => ({ board: new Uint8Array(SIZE * SIZE), moves: [], turn: openingPlayer(human), result: null })
const levels: { value: Difficulty; label: string; description: string }[] = [
  { value: 'easy', label: '轻松', description: '随性落子' },
  { value: 'medium', label: '标准', description: '攻守兼备' },
  { value: 'hard', label: '挑战', description: '步步为营' },
]

function ArrowIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function Board({ game, human, disabled, onMove }: { game: Game; human: Stone; disabled: boolean; onMove: (index: number) => void }) {
  const last = game.moves.at(-1)
  return <div className="board-wrap">
    <div className="board" role="group" aria-label="十五路五子棋棋盘">
      <svg className="board-lines" viewBox="0 0 14 14" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: SIZE }, (_, i) => <g key={i}><path d={`M0 ${i}H14 M${i} 0V14`} /></g>)}
        {[3, 7, 11].flatMap(y => [3, 7, 11].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r=".085" />))}
      </svg>
      <div className="intersections">
        {Array.from(game.board, (cell, index) => {
          const row = Math.floor(index / SIZE) + 1
          const col = String.fromCharCode(65 + index % SIZE)
          return <button
            key={index}
            className={`intersection ${cell === BLACK ? 'is-black' : cell === WHITE ? 'is-white' : ''} ${last === index ? 'is-last' : ''}`}
            type="button"
            aria-label={`${col}${row}${cell === BLACK ? ' 黑子' : cell === WHITE ? ' 白子' : ' 空位'}`}
            aria-disabled={disabled || cell !== EMPTY}
            tabIndex={cell === EMPTY && !disabled ? 0 : -1}
            onClick={() => { if (!disabled && cell === EMPTY) onMove(index) }}
          ><span className="stone" /><span className={`preview ${human === WHITE ? 'preview-white' : ''}`} /></button>
        })}
      </div>
    </div>
    <div className="board-corner top-left" /><div className="board-corner top-right" />
    <div className="board-corner bottom-left" /><div className="board-corner bottom-right" />
  </div>
}

export default function App() {
  const [human, setHuman] = useState<Stone>(BLACK)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [game, setGame] = useState<Game>(() => newGame(BLACK))
  const [engine, setEngine] = useState<ScoreMove | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    let active = true
    initWasm().then(() => { if (active) setEngine(() => score_move) }).catch(() => { if (active) setLoadError(true) })
    return () => { active = false }
  }, [])

  const ai = other(human)
  useEffect(() => {
    if (!engine || game.result || game.turn !== ai) return
    const timer = window.setTimeout(() => {
      const board = game.board.slice()
      const index = chooseMove(board, ai, difficulty, engine)
      board[index] = ai
      setGame({ board, moves: [...game.moves, index], turn: human, result: resultAfterMove(board, index, ai) })
    }, 320)
    return () => window.clearTimeout(timer)
  }, [ai, difficulty, engine, game, human])

  const play = (index: number) => {
    if (!engine || game.result || game.turn !== human || game.board[index] !== EMPTY) return
    const board = game.board.slice()
    board[index] = human
    setGame({ board, moves: [...game.moves, index], turn: ai, result: resultAfterMove(board, index, human) })
  }

  const changeSide = (side: Stone) => { setHuman(side); setGame(newGame(side)) }
  const changeLevel = (level: Difficulty) => { setDifficulty(level); setGame(newGame(human)) }
  const undo = () => {
    const firstMove = human === WHITE ? 1 : 0
    if (game.moves.length <= firstMove) return
    const count = game.turn === ai && !game.result ? 1 : 2
    const moves = game.moves.slice(0, Math.max(firstMove, game.moves.length - count))
    const board = new Uint8Array(SIZE * SIZE)
    moves.forEach((index, i) => { board[index] = (i % 2 === 0 ? BLACK : WHITE) })
    setGame({ board, moves, turn: human, result: null })
  }

  const thinking = !!engine && !game.result && game.turn === ai
  const status = loadError ? '引擎加载失败，请刷新页面重试' : !engine ? '正在准备棋局…' : game.result === 'draw' ? '平局，棋逢对手' : game.result === human ? '漂亮！你赢了' : game.result === ai ? '这局 AI 赢了' : thinking ? 'AI 正在思考…' : '轮到你落子'
  const substatus = game.result ? '再来一局，下一手也许就不同。' : thinking ? '好棋值得等一等。' : '选一个交叉点，开始你的下一步。'

  return <div className="app-shell">
    <header className="site-header">
      <div className="brand"><span className="brand-mark"><i /><i /><i /><i /></span><span>五子棋 <em>/</em> GOMOKU</span></div>
      <button className="header-link" type="button" onClick={() => setShowRules(true)}>游戏规则 <ArrowIcon /></button>
    </header>

    <main className="game-layout">
      <section className="sidebar" aria-label="游戏设置">
        <div className="intro"><div className="eyebrow"><span className="eyebrow-line" /> 与 AI 对弈 <span className="eyebrow-number">01 / 02</span></div><h1>落子之间，<br /><span>见分晓。</span></h1><p>一方棋盘，两种颜色。放慢一点，想远一点，享受每一步的可能。</p></div>

        <div className="settings">
          <div className="setting-group"><div className="setting-heading"><span>01</span><h2>选择难度</h2></div><div className="level-list">{levels.map(level => <button type="button" key={level.value} className={`level ${difficulty === level.value ? 'selected' : ''}`} aria-pressed={difficulty === level.value} onClick={() => changeLevel(level.value)}><span className="level-radio" /><span className="level-name">{level.label}</span><span className="level-description">{level.description}</span></button>)}</div></div>
          <div className="setting-group side-group"><div className="setting-heading"><span>02</span><h2>执子颜色</h2></div><div className="side-options"><button type="button" className={`side-option ${human === BLACK ? 'selected' : ''}`} aria-pressed={human === BLACK} onClick={() => changeSide(BLACK)}><span className="sample-stone black" />执黑 <small>先手</small></button><button type="button" className={`side-option ${human === WHITE ? 'selected' : ''}`} aria-pressed={human === WHITE} onClick={() => changeSide(WHITE)}><span className="sample-stone white" />执白 <small>后手</small></button></div></div>
        </div>
        <div className="sidebar-note"><span className="asterisk">✳</span><p>五子连珠，即为胜利。<br />在这里，不必着急。</p></div>
      </section>

      <section className="play-area" aria-label="对弈区域">
        <div className="play-top"><div><span className="overline">CURRENT MATCH</span><div className="match-name">你 <span>VS</span> AI <span className="match-level">/ {levels.find(level => level.value === difficulty)?.label}</span></div></div><span className="match-round">{String(game.moves.length + 1).padStart(2, '0')} <span>/ MOVE</span></span></div>
        <Board game={game} human={human} disabled={!engine || game.turn !== human || !!game.result} onMove={play} />
        <div className="play-bottom"><div className="status"><span className={`status-dot ${thinking ? 'thinking' : ''}`} /><div><strong role="status" aria-live="polite">{status}</strong><span>{substatus}</span></div></div><div className="game-actions"><button type="button" className="undo-button" disabled={game.moves.length <= (human === WHITE ? 1 : 0)} onClick={undo}>↶ <span>悔一步</span></button><button type="button" className="restart-button" onClick={() => setGame(newGame(human))}>重新开始 <ArrowIcon /></button></div></div>
      </section>
    </main>

    <footer className="site-footer"><span>一盘好棋，从这一手开始。</span><span>GOMOKU · MADE FOR THE MOMENT</span></footer>

    {showRules && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setShowRules(false) }}><div className="rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title"><button className="close-button" aria-label="关闭规则" type="button" onClick={() => setShowRules(false)}>×</button><span className="overline">HOW TO PLAY</span><h2 id="rules-title">简单规则，<br />无限可能。</h2><p>黑棋先行，双方轮流在棋盘交叉点上落子。率先将五颗或更多同色棋子连成一线的一方获胜，横、竖、斜线均可。棋盘下满则为平局。</p><p>你可以随时悔棋，或切换难度与执子颜色开始新的一局。</p><button className="restart-button" type="button" onClick={() => setShowRules(false)}>开始对弈 <ArrowIcon /></button></div></div>}
  </div>
}
