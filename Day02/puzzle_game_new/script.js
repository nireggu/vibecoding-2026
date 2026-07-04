const emojiPool = [
  "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭",
  "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "🫐", "🥝",
  "🥥", "🍅", "🥑", "🫒", "🍆", "🌶️", "🫑", "🥕",
  "🍞", "🧀", "🥨", "🍪", "🍩", "🍰", "🍫", "🍿",
  "⚽", "🏀", "🏈", "⚾", "🎾", "🎲", "🎯", "🎮",
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"
];

const stageSettings = [
  { label: "쉬움", size: 2 },
  { label: "중간", size: 4 },
  { label: "어려움", size: 6 },
  { label: "매우 어려움", size: 8 }
];

const stageDurationSeconds = 60;

const boardElement = document.getElementById("board");
const attemptCountElement = document.getElementById("attemptCount");
const stageCountElement = document.getElementById("stageCount");
const timeLeftCountElement = document.getElementById("timeLeftCount");
const scoreCountElement = document.getElementById("scoreCount");
const messageElement = document.getElementById("message");
const gameAreaElement = document.getElementById("gameArea");
const startScreenElement = document.getElementById("startScreen");
const resultScreenElement = document.getElementById("resultScreen");
const resultKickerElement = document.getElementById("resultKicker");
const resultTitleElement = document.getElementById("resultTitle");
const resultTextElement = document.getElementById("resultText");
const startButton = document.getElementById("startButton");
const resultButton = document.getElementById("resultButton");
const restartButton = document.getElementById("restartButton");
const fireworksCanvas = document.getElementById("fireworksCanvas");
const fireworksContext = fireworksCanvas.getContext("2d");

let firstCard = null;
let secondCard = null;
let boardLocked = false;
let gameStarted = false;
let gameEnded = false;
let currentStageIndex = 0;
let targetPairs = 0;
let matchedPairs = 0;
let attemptCount = 0;
let scoreCount = 0;
let timeLeftSeconds = stageDurationSeconds;
let timerIntervalId = null;
let pendingMatchTimeoutId = null;
let pendingStageTimeoutId = null;
let pendingFireworkFrameId = null;
let pendingFireworkTimers = [];
let fireworkParticles = [];

function shuffleArray(array) {
  const shuffled = [...array];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function pickUniqueEmojis(count) {
  return shuffleArray(emojiPool).slice(0, count);
}

function getCurrentStage() {
  return stageSettings[currentStageIndex] || stageSettings[0];
}

function showElement(element) {
  element.classList.add("show");
  element.setAttribute("aria-hidden", "false");
}

function hideElement(element) {
  element.classList.remove("show");
  element.setAttribute("aria-hidden", "true");
}

function showGameArea() {
  gameAreaElement.classList.remove("hidden");
}

function hideGameArea() {
  gameAreaElement.classList.add("hidden");
}

function setMessage(text, type = "normal") {
  messageElement.textContent = text;
  messageElement.classList.toggle("done", type === "done");
  messageElement.classList.toggle("fail", type === "fail");
}

function updateAttemptCount() {
  attemptCountElement.textContent = attemptCount;
}

function updateStageCount() {
  const stage = getCurrentStage();
  stageCountElement.textContent = `${stage.label} ${currentStageIndex + 1}/${stageSettings.length}`;
}

function updateScoreCount() {
  scoreCountElement.textContent = scoreCount;
}

function updateTimeLeftCount() {
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  timeLeftCountElement.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function clearTimer() {
  if (timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function clearPendingMatchTimeout() {
  if (pendingMatchTimeoutId !== null) {
    clearTimeout(pendingMatchTimeoutId);
    pendingMatchTimeoutId = null;
  }
}

function clearPendingStageTimeout() {
  if (pendingStageTimeoutId !== null) {
    clearTimeout(pendingStageTimeoutId);
    pendingStageTimeoutId = null;
  }
}

function resizeFireworksCanvas() {
  const rect = fireworksCanvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;

  fireworksCanvas.width = rect.width * scale;
  fireworksCanvas.height = rect.height * scale;
  fireworksContext.setTransform(scale, 0, 0, scale, 0, 0);
}

function clearFireworksCanvas() {
  const rect = fireworksCanvas.getBoundingClientRect();
  fireworksContext.clearRect(0, 0, rect.width, rect.height);
}

function createFireworkBurst() {
  const rect = fireworksCanvas.getBoundingClientRect();
  const centerX = Math.random() * rect.width * 0.8 + rect.width * 0.1;
  const centerY = Math.random() * rect.height * 0.35 + rect.height * 0.08;
  const colors = ["#ff4d6d", "#ffd166", "#7cdb8a", "#5aa9ff", "#b56bff", "#ff8fab"];
  const sparkCount = 16;

  for (let index = 0; index < sparkCount; index += 1) {
    const angle = (Math.PI * 2 * index) / sparkCount;
    const speed = 2.5 + Math.random() * 4.5;

    fireworkParticles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.04 + Math.random() * 0.03,
      life: 70 + Math.random() * 24,
      maxLife: 70 + Math.random() * 24,
      size: 2 + Math.random() * 2.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function drawFireworksFrame() {
  clearFireworksCanvas();

  fireworkParticles = fireworkParticles.filter((particle) => particle.life > 0);

  fireworkParticles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.life -= 1;

    fireworksContext.beginPath();
    fireworksContext.globalAlpha = Math.max(particle.life / particle.maxLife, 0);
    fireworksContext.fillStyle = particle.color;
    fireworksContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    fireworksContext.fill();
  });

  fireworksContext.globalAlpha = 1;

  if (fireworkParticles.length === 0) {
    pendingFireworkFrameId = null;
    clearFireworksCanvas();
    return;
  }

  pendingFireworkFrameId = requestAnimationFrame(drawFireworksFrame);
}

function stopFireworks() {
  fireworkParticles = [];

  pendingFireworkTimers.forEach((timerId) => {
    clearTimeout(timerId);
  });
  pendingFireworkTimers = [];

  if (pendingFireworkFrameId !== null) {
    cancelAnimationFrame(pendingFireworkFrameId);
    pendingFireworkFrameId = null;
  }

  clearFireworksCanvas();
}

function startFireworks(burstCount = 8) {
  stopFireworks();
  resizeFireworksCanvas();

  for (let index = 0; index < burstCount; index += 1) {
    const timerId = setTimeout(createFireworkBurst, index * 120);
    pendingFireworkTimers.push(timerId);
  }

  pendingFireworkFrameId = requestAnimationFrame(drawFireworksFrame);
}

function createBlankCard() {
  const blank = document.createElement("div");
  blank.className = "card";
  blank.style.visibility = "hidden";
  blank.setAttribute("aria-hidden", "true");
  return blank;
}

function createCardElement(emoji) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card";
  card.dataset.value = emoji;
  card.setAttribute("aria-label", "카드");

  const emojiElement = document.createElement("span");
  emojiElement.className = "emoji";
  emojiElement.textContent = emoji;

  card.appendChild(emojiElement);
  card.addEventListener("click", () => handleCardClick(card));

  return card;
}

function renderBoard() {
  const stage = getCurrentStage();
  const totalCellCount = stage.size * stage.size;
  const pairCount = totalCellCount / 2;

  targetPairs = pairCount;
  boardElement.style.gridTemplateColumns = `repeat(${stage.size}, minmax(0, 1fr))`;
  boardElement.innerHTML = "";

  const selectedEmojis = pickUniqueEmojis(pairCount);
  const cards = shuffleArray([...selectedEmojis, ...selectedEmojis]);

  cards.forEach((emoji) => {
    boardElement.appendChild(createCardElement(emoji));
  });
}

function resetSelectedCards() {
  firstCard = null;
  secondCard = null;
  boardLocked = false;
}

function startTimer() {
  clearTimer();
  timerIntervalId = setInterval(() => {
    if (gameEnded) {
      clearTimer();
      return;
    }

    timeLeftSeconds -= 1;
    updateTimeLeftCount();

    if (timeLeftSeconds <= 0) {
      handleTimeOver();
    }
  }, 1000);
}

function lockBoard() {
  boardLocked = true;
  boardElement.querySelectorAll(".card").forEach((card) => {
    card.disabled = true;
  });
}

function startStage(stageIndex) {
  clearPendingMatchTimeout();
  clearPendingStageTimeout();
  stopFireworks();
  clearTimer();

  currentStageIndex = stageIndex;
  matchedPairs = 0;
  targetPairs = 0;
  firstCard = null;
  secondCard = null;
  boardLocked = false;
  timeLeftSeconds = stageDurationSeconds;
  gameEnded = false;

  updateStageCount();
  updateTimeLeftCount();
  setMessage("같은 그림을 찾아서 짝을 맞춰보세요.");
  renderBoard();
  startTimer();
}

function showStartScreen() {
  hideElement(resultScreenElement);
  showElement(startScreenElement);
}

function showResultScreen({ kicker, title, text, buttonLabel }) {
  resultKickerElement.textContent = kicker;
  resultTitleElement.textContent = title;
  resultTextElement.textContent = text;
  resultButton.textContent = buttonLabel;
  hideElement(startScreenElement);
  showElement(resultScreenElement);
}

function beginGame() {
  gameStarted = true;
  hideElement(startScreenElement);
  hideElement(resultScreenElement);
  showGameArea();
  startStage(0);
}

function resetToStartScreen() {
  clearPendingMatchTimeout();
  clearPendingStageTimeout();
  clearTimer();
  stopFireworks();

  gameStarted = false;
  gameEnded = false;
  currentStageIndex = 0;
  matchedPairs = 0;
  targetPairs = 0;
  attemptCount = 0;
  scoreCount = 0;
  timeLeftSeconds = stageDurationSeconds;
  firstCard = null;
  secondCard = null;
  boardLocked = false;

  updateAttemptCount();
  updateStageCount();
  updateTimeLeftCount();
  updateScoreCount();
  setMessage("시작 버튼을 눌러 게임을 시작하세요.");
  boardElement.innerHTML = "";
  hideGameArea();
  showStartScreen();
}

function handleFinalClear() {
  gameEnded = true;
  lockBoard();
  clearTimer();
  setMessage("축하합니다. 시간 안에 클리어 하셨습니다.", "done");
  showResultScreen({
    kicker: "Clear",
    title: "축하합니다. 시간 안에 클리어 하셨습니다.",
    text: "모든 레벨을 완성했습니다. 폭죽이 터지는 동안 결과를 즐겨보세요.",
    buttonLabel: "다시 시작"
  });
  startFireworks(40);
}

function moveToNextStage() {
  clearPendingStageTimeout();
  boardLocked = true;
  clearTimer();
  setMessage(`단계 클리어! ${stageSettings[currentStageIndex + 1].label} 단계로 이동합니다.`, "done");

  pendingStageTimeoutId = setTimeout(() => {
    pendingStageTimeoutId = null;
    startStage(currentStageIndex + 1);
  }, 900);
}

function handleTimeOver() {
  if (gameEnded) {
    return;
  }

  gameEnded = true;
  timeLeftSeconds = 0;
  updateTimeLeftCount();
  clearPendingMatchTimeout();
  clearPendingStageTimeout();
  stopFireworks();
  lockBoard();
  setMessage("시간이 끝났습니다. 게임오버입니다.", "fail");
  showResultScreen({
    kicker: "Game Over",
    title: "시간이 끝났습니다. 게임오버입니다.",
    text: "처음 화면으로 돌아가서 다시 도전해 보세요.",
    buttonLabel: "다시 시작"
  });
}

function handleMatchedPair() {
  firstCard.classList.add("matched");
  secondCard.classList.add("matched");
  firstCard.disabled = true;
  secondCard.disabled = true;
  matchedPairs += 1;
  scoreCount += 10;
  updateScoreCount();
  setMessage("잘 찾았어요! 같은 그림입니다.", "done");
  resetSelectedCards();

  if (matchedPairs === targetPairs) {
    if (currentStageIndex >= stageSettings.length - 1) {
      handleFinalClear();
      return;
    }

    moveToNextStage();
  }
}

function handleMismatchedPair() {
  setMessage("다른 그림입니다. 잠깐 뒤에 다시 뒤집어요.");
  clearPendingMatchTimeout();

  pendingMatchTimeoutId = setTimeout(() => {
    if (firstCard) {
      firstCard.classList.remove("flipped");
    }
    if (secondCard) {
      secondCard.classList.remove("flipped");
    }
    setMessage("다시 같은 그림을 찾아보세요.");
    resetSelectedCards();
    pendingMatchTimeoutId = null;
  }, 700);
}

function handleSecondSelection(card) {
  secondCard = card;
  attemptCount += 1;
  updateAttemptCount();
  boardLocked = true;

  if (firstCard.dataset.value === secondCard.dataset.value) {
    handleMatchedPair();
    return;
  }

  handleMismatchedPair();
}

function handleCardClick(card) {
  if (!gameStarted || gameEnded || boardLocked || card === firstCard || card.classList.contains("matched")) {
    return;
  }

  card.classList.add("flipped");

  if (!firstCard) {
    firstCard = card;
    return;
  }

  handleSecondSelection(card);
}

startButton.addEventListener("click", beginGame);
resultButton.addEventListener("click", resetToStartScreen);
restartButton.addEventListener("click", resetToStartScreen);
window.addEventListener("resize", resizeFireworksCanvas);

resizeFireworksCanvas();
resetToStartScreen();
