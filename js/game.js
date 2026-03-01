import { MAX_GUESSES, WORD_LENGTH, NUM_BOARDS } from './config.js';
import { palabrasValidas, getDailyWords, getChallengeNumber } from './data.js';
import {
    updateGridDisplay as _updateGridDisplay,
    updateKeyboard as _updateKeyboard,
    scrollToActiveRow as _scrollToActiveRow,
} from './ui.js';

// Estado del juego
export let currentGuess = "";
export let currentRow = 0;
export let boardSolved = [false, false, false, false];
export let boardSolvedAt = [null, null, null, null];
export let gameOver = false;
export const keyboardState = {};
export const disabledLetters = new Set();
export let guesses = [];
export let targetWords = [];

function showMessage(msg) {
    const m = document.getElementById('message');
    m.textContent = msg;
    setTimeout(() => {
        if (!gameOver && m.textContent === msg) m.textContent = "";
    }, 2000);
}

export function handleInput(key) {
    if (gameOver) return;
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE' || key === '⌫') {
        if (currentGuess.length > 0) {
            currentGuess = currentGuess.slice(0, -1);
            _updateGridDisplay(currentRow, currentGuess, boardSolved);
        }
    } else if (/^[A-ZÑ]$/.test(key)) {
        if (disabledLetters.has(key)) return;
        if (currentGuess.length < WORD_LENGTH) {
            currentGuess += key;
            _updateGridDisplay(currentRow, currentGuess, boardSolved);
        }
    }
}

export function submitGuess() {
    if (currentGuess.length !== WORD_LENGTH) {
        showMessage("¡Faltan letras!");
        return;
    }

    if (!palabrasValidas.has(currentGuess.toLowerCase())) {
        showMessage("Palabra no válida");
        return;
    }

    for (let b = 0; b < NUM_BOARDS; b++) {
        if (boardSolved[b]) continue;

        const target = targetWords[b];
        const guess = currentGuess;
        let targetChars = target.split('');
        let guessChars = guess.split('');
        let colors = Array(WORD_LENGTH).fill('absent');

        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guessChars[i] === targetChars[i]) {
                colors[i] = 'correct';
                targetChars[i] = null;
                guessChars[i] = null;
            }
        }
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guessChars[i] !== null) {
                const idx = targetChars.indexOf(guessChars[i]);
                if (idx > -1) {
                    colors[i] = 'present';
                    targetChars[idx] = null;
                }
            }
        }

        for (let i = 0; i < WORD_LENGTH; i++) {
            const tile = document.getElementById(`board-${b}-row-${currentRow}-tile-${i}`);
            tile.classList.add(colors[i]);
        }

        colors.forEach((color, i) => {
            const letter = guess[i];
            if (!keyboardState[letter]) {
                keyboardState[letter] = [null, null, null, null];
            }
            const priority = { correct: 3, present: 2, absent: 1, null: 0 };
            const prev = keyboardState[letter][b];
            if (priority[color] > priority[prev]) {
                keyboardState[letter][b] = color;
            }
        });

        if (guess === target) {
            boardSolved[b] = true;
            boardSolvedAt[b] = currentRow + 1;
            document.getElementById(`board-${b}`).classList.add('solved-overlay');
        }

        _updateKeyboard(keyboardState, boardSolved);
    }

    const uniqueGuessChars = [...new Set(currentGuess.split(''))];
    uniqueGuessChars.forEach(char => {
        let existsInUnsolved = false;
        for (let b = 0; b < NUM_BOARDS; b++) {
            if (!boardSolved[b] && targetWords[b].includes(char)) {
                existsInUnsolved = true;
                break;
            }
        }
        if (!existsInUnsolved) {
            disabledLetters.add(char);
            const k = document.getElementById(`key-${char}`);
            if (k) k.classList.add('disabled');
        }
    });

    guesses.push(currentGuess);
    localStorage.setItem('cuatroPalabrasState', JSON.stringify({
        date: new Date().toDateString(),
        guesses: guesses,
    }));

    currentRow++;
    currentGuess = "";
    showMessage("");
    _scrollToActiveRow(currentRow, boardSolved);

    if (boardSolved.every(s => s)) {
        showMessage("¡VICTORIA TOTAL! 🎉");
        endGame();
    } else if (currentRow >= MAX_GUESSES) {
        showMessage(`Fin del juego 💀 Soluciones: ${targetWords.join(", ")}`);
        endGame();
    }
}

function endGame() {
    gameOver = true;
    const challengeNum = getChallengeNumber();
    const messageElement = document.getElementById('message');
    messageElement.innerHTML = `<h3>Reto #${challengeNum}</h3>` + messageElement.innerHTML;
    document.getElementById('share-btn').style.display = 'block';
    document.querySelector('.keyboard').style.display = 'none';
    document.querySelector('.game-container').style.paddingBottom = '10px';

    document.querySelectorAll('.board').forEach(board => {
        const tileSize = getComputedStyle(board).getPropertyValue('--tile-size');
        const rowsToShow = currentRow;
        const newHeight = `calc(${tileSize} * ${rowsToShow} + ${rowsToShow * 2 + 8}px)`;
        board.style.height = newHeight;
        board.style.maxHeight = 'none';
    });

    document.querySelectorAll('.board-track').forEach(track => {
        track.style.transform = 'translateY(0)';
    });
}

export function generateShareText() {
    const emojis = { correct: '🟩', present: '🟨', absent: '⬛', empty: '⬜' };
    const challengeNum = getChallengeNumber();

    const score0 = boardSolvedAt[0] || 11;
    const score1 = boardSolvedAt[1] || 11;
    const score2 = boardSolvedAt[2] || 11;
    const score3 = boardSolvedAt[3] || 11;
    const totalScore = score0 + score1 + score2 + score3;

    let text = `Cuordle #${challengeNum} 🧩\n`;
    text += `Total: ${totalScore}\n\n`;
    text += `${boardSolvedAt[0] || '💀'} ${boardSolvedAt[1] || '💀'}\n`;
    text += `${boardSolvedAt[2] || '💀'} ${boardSolvedAt[3] || '💀'}\n\n`;

    const getRowEmojis = (boardIdx, rowIdx) => {
        let line = "";
        for (let t = 0; t < WORD_LENGTH; t++) {
            const tile = document.getElementById(`board-${boardIdx}-row-${rowIdx}-tile-${t}`);
            if (tile.classList.contains('correct')) line += emojis.correct;
            else if (tile.classList.contains('present')) line += emojis.present;
            else if (tile.classList.contains('absent')) line += emojis.absent;
            else line += emojis.empty;
        }
        return line;
    };

    for (let r = 0; r < currentRow; r++) {
        text += getRowEmojis(0, r) + " " + getRowEmojis(1, r) + "\n";
    }
    text += "\n";
    for (let r = 0; r < currentRow; r++) {
        text += getRowEmojis(2, r) + " " + getRowEmojis(3, r) + "\n";
    }
    text += "\n🎮 Juega en: https://jegomei.github.io/Cuardle/";
    return text;
}

export function loadGame() {
    targetWords = getDailyWords();

    const savedData = localStorage.getItem('cuatroPalabrasState');
    if (!savedData) return;

    const parsedData = JSON.parse(savedData);
    const today = new Date().toDateString();

    if (parsedData.date !== today) {
        localStorage.removeItem('cuatroPalabrasState');
        return;
    }

    parsedData.guesses.forEach(word => {
        currentGuess = word;
        _updateGridDisplay(currentRow, currentGuess, boardSolved);
        submitGuess();
    });

    setTimeout(() => _scrollToActiveRow(currentRow, boardSolved), 50);
}
