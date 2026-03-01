import { WORD_LENGTH, NUM_BOARDS, MAX_GUESSES } from './config.js';

export function buildBoards(container) {
    for (let b = 0; b < NUM_BOARDS; b++) {
        const boardDiv = document.createElement('div');
        boardDiv.className = 'board';
        boardDiv.id = `board-${b}`;

        const trackDiv = document.createElement('div');
        trackDiv.className = 'board-track';
        trackDiv.id = `board-${b}-track`;

        for (let r = 0; r < MAX_GUESSES; r++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'row';
            rowDiv.id = `board-${b}-row-${r}`;
            for (let t = 0; t < WORD_LENGTH; t++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = `board-${b}-row-${r}-tile-${t}`;
                rowDiv.appendChild(tile);
            }
            trackDiv.appendChild(rowDiv);
        }

        boardDiv.appendChild(trackDiv);
        container.appendChild(boardDiv);
    }
}

function createKey(container, display, className, actionId, onKey) {
    const button = document.createElement('button');
    button.className = `key key-multi ${className}`;
    button.id = actionId ? `key-${actionId}` : `key-${display}`;

    if (/^[A-ZÑ]$/.test(display)) {
        button.innerHTML = `
            <div class="key-grid">
                <div class="quad" data-board="0"></div>
                <div class="quad" data-board="1"></div>
                <div class="quad" data-board="2"></div>
                <div class="quad" data-board="3"></div>
            </div>
            <span class="key-label">${display}</span>
        `;
    } else {
        button.textContent = display;
    }

    button.addEventListener('click', (e) => {
        e.preventDefault();
        onKey(actionId || display);
    });

    container.appendChild(button);
}

export function buildKeyboard(container, layout, onKey) {
    layout.forEach((rowString, i) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'kb-row';

        if (i === 2) {
            createKey(rowDiv, '⌫', 'key-wide key-delete', 'BACKSPACE', onKey);
        }
        for (const char of rowString) {
            createKey(rowDiv, char, '', null, onKey);
        }
        if (i === 2) {
            createKey(rowDiv, 'ENTER', 'key-wide key-confirm', null, onKey);
        }

        container.appendChild(rowDiv);
    });
}

export function updateGridDisplay(currentRow, currentGuess, boardSolved) {
    for (let b = 0; b < NUM_BOARDS; b++) {
        if (boardSolved[b]) continue;
        for (let i = 0; i < WORD_LENGTH; i++) {
            const tile = document.getElementById(`board-${b}-row-${currentRow}-tile-${i}`);
            tile.textContent = currentGuess[i] || "";
        }
    }
}

export function updateKeyboard(keyboardState, boardSolved) {
    for (const letter in keyboardState) {
        const key = document.getElementById(`key-${letter}`);
        if (!key) continue;

        const states = keyboardState[letter];
        const quads = key.querySelectorAll('.quad');
        let exhausted = true;

        states.forEach((state, idx) => {
            quads[idx].className = 'quad' + (state ? ` ${state}` : '');
            if (!boardSolved[idx] && state !== 'absent') {
                exhausted = false;
            }
        });

        if (exhausted) {
            key.classList.add('key-exhausted');
        } else {
            key.classList.remove('key-exhausted');
        }
    }
}

export function scrollToActiveRow(currentRow, boardSolved) {
    const firstTile = document.querySelector('.tile');
    if (!firstTile) return;

    const rowHeight = firstTile.offsetHeight + 2;

    for (let b = 0; b < NUM_BOARDS; b++) {
        const track = document.getElementById(`board-${b}-track`);
        if (!track) continue;

        if (boardSolved[b]) {
            track.style.transform = 'translateY(0)';
            continue;
        }

        let scrollIndex = 0;
        if (currentRow > 3) {
            scrollIndex = currentRow - 4;
        }
        track.style.transform = `translateY(-${scrollIndex * rowHeight}px)`;
    }
}
