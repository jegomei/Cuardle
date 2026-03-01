import { LAYOUT } from './config.js';
import { cargarDiccionario, cargarPalabrasObjetivo } from './data.js';
import { buildBoards, buildKeyboard } from './ui.js';
import { handleInput, loadGame, generateShareText } from './game.js';

// Construir tableros y teclado
buildBoards(document.getElementById('game-container'));
buildKeyboard(document.getElementById('keyboard'), LAYOUT, handleInput);

// Teclado físico
document.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();
    if (key === 'BACKSPACE' || key === 'ENTER') handleInput(key);
    else if (/^[A-ZÑ]$/.test(key)) handleInput(key);
});

// Botón compartir
document.getElementById('share-btn').addEventListener('click', () => {
    const text = generateShareText();
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        document.getElementById('message').textContent = "¡Copiado al portapapeles!";
    } catch (err) {
        document.getElementById('message').textContent = "Error al copiar :(";
    }
    document.body.removeChild(textArea);
});

// Touch largo en tableros para ver historial completo
document.querySelectorAll('.board').forEach(board => {
    let pressTimer;

    board.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pressTimer = setTimeout(() => board.classList.add('inspect'), 300);
    }, { passive: false });

    board.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
        board.classList.remove('inspect');
    });

    board.addEventListener('touchcancel', () => {
        clearTimeout(pressTimer);
        board.classList.remove('inspect');
    });

    board.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
        board.classList.remove('inspect');
    });
});

// Iniciar juego
Promise.all([cargarDiccionario(), cargarPalabrasObjetivo()]).then(() => {
    loadGame();
});
