use wasm_bindgen::prelude::*;

const SIZE: i32 = 15;
const DIRECTIONS: [(i32, i32); 4] = [(1, 0), (0, 1), (1, 1), (1, -1)];

fn at(board: &[u8], x: i32, y: i32) -> u8 {
    if x < 0 || y < 0 || x >= SIZE || y >= SIZE {
        return 3;
    }
    board[(y * SIZE + x) as usize]
}

#[wasm_bindgen]
pub fn score_move(board: &[u8], index: usize, player: u8) -> i32 {
    if board.len() != (SIZE * SIZE) as usize || index >= board.len() || board[index] != 0 {
        return 0;
    }

    let x = (index as i32) % SIZE;
    let y = (index as i32) / SIZE;
    let mut score = 0;

    for (dx, dy) in DIRECTIONS {
        let mut count = 1;
        let mut open = 0;

        for sign in [-1, 1] {
            let mut step = 1;
            while at(board, x + dx * sign * step, y + dy * sign * step) == player {
                count += 1;
                step += 1;
            }
            if at(board, x + dx * sign * step, y + dy * sign * step) == 0 {
                open += 1;
            }
        }

        score += match (count, open) {
            (5.., _) => 1_000_000,
            (4, 2) => 30_000,
            (4, 1) => 8_000,
            (3, 2) => 3_000,
            (3, 1) => 350,
            (2, 2) => 180,
            (2, 1) => 35,
            (1, 2) => 6,
            _ => 0,
        };

        // Count broken shapes such as XX_XX in any five-cell window containing the move.
        for offset in -4..=0 {
            let mut stones = 0;
            let mut blanks = 0;
            let mut blocked = false;
            for step in 0..5 {
                let px = x + (offset + step) * dx;
                let py = y + (offset + step) * dy;
                let cell = if px == x && py == y { player } else { at(board, px, py) };
                if cell == player {
                    stones += 1;
                } else if cell == 0 {
                    blanks += 1;
                } else {
                    blocked = true;
                    break;
                }
            }
            if !blocked && blanks > 0 {
                score += match stones {
                    4 => 400,
                    3 => 35,
                    2 => 3,
                    _ => 0,
                };
            }
        }
    }

    score
}
