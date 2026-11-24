// --- SISTEMA DE ÁUDIO (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, delay = 0) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration);
}

const sfx = {
    suspense: () => {
        playTone(220, 'triangle', 0.3, 0);
        playTone(233, 'triangle', 0.4, 0.25);
    },
    correct: () => {
        playTone(523.25, 'sine', 0.15, 0);    // Dó
        playTone(659.25, 'sine', 0.15, 0.12); // Mi
        playTone(783.99, 'sine', 0.35, 0.24); // Sol
    },
    wrong: () => {
        playTone(300, 'sawtooth', 0.25, 0);
        playTone(210, 'sawtooth', 0.5, 0.2);
    },
    skip: () => {
        playTone(440, 'sine', 0.1, 0);
        playTone(587, 'sine', 0.15, 0.08);
    }
};

// --- BANCO DE PERGUNTAS ---
const questions = [
    { q: "Qual é a capital do Brasil?", options: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], answer: 2 },
    { q: "Quantos estados tem o Brasil (sem contar o Distrito Federal)?", options: ["25", "26", "27", "24"], answer: 1 },
    { q: "Qual planeta é conhecido como o Planeta Vermelho?", options: ["Vênus", "Júpiter", "Saturno", "Marte"], answer: 3 },
    { q: "Quem pintou a obra 'Mona Lisa'?", options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"], answer: 2 },
    { q: "Qual é o maior oceano da Terra?", options: ["Atlântico", "Índico", "Ártico", "Pacífico"], answer: 3 },
    { q: "Em que ano o homem pisou na Lua pela primeira vez?", options: ["1965", "1969", "1972", "1959"], answer: 1 },
    { q: "Qual elemento químico tem o símbolo 'Au'?", options: ["Prata", "Alumínio", "Ouro", "Cobre"], answer: 2 },
    { q: "Qual é o menor país do mundo em área territorial?", options: ["Mônaco", "Vaticano", "San Marino", "Malta"], answer: 1 }
];

// --- ESCALA DE PRÊMIOS ---
const prizes = [
    { current: "R$ 1.000", stop: "R$ 0", wrong: "R$ 0" },
    { current: "R$ 5.000", stop: "R$ 1.000", wrong: "R$ 500" },
    { current: "R$ 50.000", stop: "R$ 5.000", wrong: "R$ 2.500" },
    { current: "R$ 500.000", stop: "R$ 50.000", wrong: "R$ 25.000" },
    { current: "R$ 1 MILHÃO", stop: "R$ 500.000", wrong: "PERDE TUDO" }
];

let currentLevel = 0;
let skips = 3;
let availableQuestions = [];
let currentQuestion = null;
let isLocked = false;

// Elementos do DOM
const questionText = document.getElementById('question-text');
const optionBtns = document.querySelectorAll('.option-btn');
const currentPrizeEl = document.getElementById('current-prize');
const stopPrizeEl = document.getElementById('stop-prize');
const wrongPrizeEl = document.getElementById('wrong-prize');
const skipBtn = document.getElementById('btn-skip');
const stopBtn = document.getElementById('btn-stop');
const skipsLeftEl = document.getElementById('skips-left');
const quizArea = document.getElementById('quiz-area');
const endScreen = document.getElementById('end-screen');
const endTitle = document.getElementById('end-title');
const endMessage = document.getElementById('end-message');

function startGame() {
    currentLevel = 0;
    skips = 3;
    availableQuestions = [...questions].sort(() => Math.random() - 0.5);
    skipsLeftEl.textContent = skips;
    skipBtn.disabled = false;
    quizArea.classList.remove('hidden');
    endScreen.classList.add('hidden');
    loadQuestion();
}

function loadQuestion() {
    isLocked = false;
    const prizeInfo = prizes[currentLevel];
    currentPrizeEl.textContent = prizeInfo.current;
    stopPrizeEl.textContent = prizeInfo.stop;
    wrongPrizeEl.textContent = prizeInfo.wrong;

    currentQuestion = availableQuestions.pop();
    questionText.textContent = currentQuestion.q;

    optionBtns.forEach((btn, index) => {
        btn.className = 'option-btn';
        btn.disabled = false;
        btn.querySelector('.text').textContent = currentQuestion.options[index];
    });
}

optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isLocked) return;
        isLocked = true;
        
        const selectedIndex = parseInt(btn.dataset.index);
        btn.classList.add('selected');
        sfx.suspense(); // Som de "Você está certo disso?"

        // Aguarda 1.5s para dar suspense antes de revelar
        setTimeout(() => {
            if (selectedIndex === currentQuestion.answer) {
                btn.classList.remove('selected');
                btn.classList.add('correct');
                sfx.correct();

                setTimeout(() => {
                    currentLevel++;
                    if (currentLevel >= prizes.length) {
                        endGame("PARABÉNS! VOCÊ GANHOU!", "Prêmio máximo: R$ 1 MILHÃO!");
                    } else {
                        loadQuestion();
                    }
                }, 1500);
            } else {
                btn.classList.remove('selected');
                btn.classList.add('wrong');
                optionBtns[currentQuestion.answer].classList.add('correct');
                sfx.wrong();

                setTimeout(() => {
                    endGame("QUE PENA, VOCÊ ERROU!", `Você sai com: ${prizes[currentLevel].wrong}`);
                }, 2000);
            }
        }, 1500);
    });
});

skipBtn.addEventListener('click', () => {
    if (isLocked || skips <= 0 || availableQuestions.length === 0) return;
    skips--;
    skipsLeftEl.textContent = skips;
    if (skips === 0) skipBtn.disabled = true;
    sfx.skip();
    loadQuestion();
});

stopBtn.addEventListener('click', () => {
    if (isLocked) return;
    endGame("VOCÊ DECIDIU PARAR!", `Prêmio garantido: ${prizes[currentLevel].stop}`);
});

document.getElementById('btn-restart').addEventListener('click', startGame);

function endGame(title, message) {
    quizArea.classList.add('hidden');
    endScreen.classList.remove('hidden');
    endTitle.textContent = title;
    endMessage.textContent = message;
}

// Inicia o jogo
startGame();
