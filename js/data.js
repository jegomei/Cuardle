import { START_DATE } from './config.js';

export let wordPool = [];
export let palabrasValidas = new Set();

export function getChallengeNumber() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(START_DATE);
    start.setHours(0, 0, 0, 0);
    const diffInTime = today.getTime() - start.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));
    return diffInDays + 1;
}

export async function cargarPalabrasObjetivo() {
    try {
        const response = await fetch('palabras-objetivo.json');
        const data = await response.json();
        wordPool = data.palabras;
        console.log(`${wordPool.length} retos cargados`);
    } catch (error) {
        console.error('Error cargando palabras objetivo:', error);
        wordPool = [
            ["salas", "morir", "muros", "pulir"],
            ["grano", "barbo", "obrar", "bravo"]
        ];
    }
}

export function getDailyWords() {
    const challengeNum = getChallengeNumber();
    const retoIndex = (challengeNum - 1) % wordPool.length;
    const reto = wordPool[retoIndex];
    return reto.map(palabra => palabra.toUpperCase().trim());
}

export async function cargarDiccionario() {
    try {
        const response = await fetch('palabras.txt');
        const texto = await response.text();
        const palabras = texto.split('\n').map(p => p.trim().toLowerCase());
        palabrasValidas = new Set(palabras);
        console.log(`${palabrasValidas.size} palabras cargadas`);
    } catch (error) {
        console.error('Error cargando diccionario:', error);
    }
}
