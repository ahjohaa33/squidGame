// =============================
// DUAL CURRENCY SYSTEM
// =============================
const EliminationRounds = (function() {
  // Configuration
  const MIN_BET = 1;
  const INITIAL_COINS = 100;
  const INITIAL_TK = 0;
  
  // State
  let coins = INITIAL_COINS;
  let tk = INITIAL_TK;
  let currentRound = 1;
  let sessionBet = 0;
  let accumulatedTK = 0;
  let sessionPot = 0;
  let sessionProgress = 0;
  let selectedColor = '';
  let cashoutAvailable = false;
  
  // Player stats
  let totalWins = 0;
  let totalLosses = 0;
  let achievements = {
    round1: false,
    round2: false,
    round3: false
  };
  
  // Round configuration
  const roundConfig = {
    1: { winProbability: 0.70, payoutMultiplier: 0.40 }, // 40% TK payout
    2: { winProbability: 0.50, payoutMultiplier: 0.40 }, // 40% TK payout
    3: { winProbability: 0.30 } // Special 2x pool payout
  };
  
  // Update UI elements
  const updateUI = function() {
    document.getElementById('coinBalance').textContent = coins;
    document.getElementById('tkBalance').textContent = tk;
    document.getElementById('currentRound').textContent = currentRound;
    document.getElementById('progressFill').style.width = `${sessionProgress}%`;
    
    // Show/hide cashout button
    const cashoutBtn = document.getElementById('cashoutButton');
    cashoutBtn.style.display = cashoutAvailable ? 'inline-block' : 'none';
    
    // Update achievements
    const achievementElements = document.querySelectorAll('.achievement');
    achievementElements[0].style.background = achievements.round1 ? 'rgba(255, 200, 0, 0.5)' : '';
    achievementElements[1].style.background = achievements.round2 ? 'rgba(255, 200, 0, 0.5)' : '';
    achievementElements[2].style.background = achievements.round3 ? 'rgba(255, 200, 0, 0.5)' : '';
  };
  
  // Start a new session
  const startSession = function(amount, color) {
    if (amount < MIN_BET) {
      showLoosePopup(`Minimum bet is ${MIN_BET} coins`);
      return false;
    }
    
    if (amount > coins) {
      showLoosePopup("Not enough coins!");
      return false;
    }
    
    // Deduct bet from coins
    coins -= amount;
    sessionBet = amount;
    sessionPot = amount;
    currentRound = 1;
    accumulatedTK = 0;
    sessionProgress = 0;
    selectedColor = color;
    cashoutAvailable = false;
    
    updateUI();
    return true;
  };
  
  // Advance to next round
  const advanceRound = function() {
    currentRound++;
    sessionProgress = Math.min(100, sessionProgress + 33);
    
    // Enable cashout after round 1
    if (currentRound >= 2) {
      cashoutAvailable = true;
    }
    
    // Unlock achievement
    if (currentRound === 2) achievements.round1 = true;
    if (currentRound === 3) achievements.round2 = true;
    
    updateUI();
  };
  
  // Handle round win
  const handleWin = function() {
    // Calculate TK winnings based on round
    let tkWon = 0;
    
    if (currentRound === 1 || currentRound === 2) {
      // 40% payout for rounds 1 and 2
      tkWon = Math.floor(sessionBet * roundConfig[currentRound].payoutMultiplier);
      accumulatedTK += tkWon;
      
      // Show win message
      showWinPopup(
        `Round ${currentRound} Won!<br>+${tkWon} TK<br>Total TK: ${accumulatedTK}`
      );
      
      advanceRound();
      return tkWon;
    } 
    else if (currentRound === 3) {
      // Round 3: 2x the accumulated pool
      tkWon = accumulatedTK * 2;
      tk += tkWon;
      achievements.round3 = true;
      
      showWinPopup(
        `JACKPOT!<br>+${tkWon} TK<br>Final Multiplier: 2x`
      );
      
      resetSession();
      return tkWon;
    }
    
    return 0;
  };
  
  // Handle cashout
  const cashout = function() {
    tk += accumulatedTK;
    const tkWon = accumulatedTK;
    
    showWinPopup(
      `Cashed out!<br>+${tkWon} TK<br>Total TK: ${tk}`
    );
    
    resetSession();
    return tkWon;
  };
  
  // Handle loss
  const handleLoss = function() {
    totalLosses++;
    
    showLoosePopup(
      `Round ${currentRound} Failed!<br>You lost ${sessionBet} coins`
    );
    
    resetSession();
    return sessionBet;
  };
  
  // Reset session
  const resetSession = function() {
    sessionBet = 0;
    accumulatedTK = 0;
    sessionPot = 0;
    currentRound = 1;
    sessionProgress = 0;
    cashoutAvailable = false;
    updateUI();
  };
  
  // Determine round outcome
  const determineOutcome = function() {
    const round = currentRound;
    const winProbability = roundConfig[round].winProbability;
    
    // Apply color weight
    let colorWeight = 1.0;
    if (selectedColor === 'black') colorWeight = 0.98;
    if (selectedColor === 'gold') colorWeight = 0.92;
    
    const effectiveProbability = winProbability * colorWeight;
    const isWin = Math.random() < effectiveProbability;
    
    return isWin;
  };
  
  // Buy coins
  const buyCoins = function(coinAmount, price) {
    coins += coinAmount;
    updateUI();
    return coinAmount;
  };
  
  // Public API
  return {
    startSession,
    cashout,
    determineOutcome,
    handleWin,
    handleLoss,
    buyCoins,
    getCurrentRound: () => currentRound,
    getSessionPot: () => sessionPot,
    getCoins: () => coins,
    getTK: () => tk,
    getAccumulatedTK: () => accumulatedTK,
    resetSession
  };
})();

// =====================
// WHEEL AND UI CODE
// =====================
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 220;
const segments = 8;
const anglePerSegment = (2 * Math.PI) / segments;

const segmentColors = ["red", "black", "red", "black", "red", "black", "gold", "black"];
const colorMap = {
  red: "#eb3e3b",
  black: "#020202",
  gold: "#FFD700"
};

let rotation = 0;
let spinning = false;
let stopSegmentIndex = null;
let spinStartTime = null;
const spinDuration = 7000;

const betInput = document.getElementById("betInput");
const winPopup = document.getElementById("winPopup");
const LoosePopup = document.getElementById("LoosePopup");
const spinButton = document.getElementById("spinButton");
const wheelContainer = document.getElementById("wheelContainer");
const colorSelect = document.getElementById("colorSelect");
const cashoutButton = document.getElementById("cashoutButton");
const round3Warning = document.getElementById("round3Warning");
const proceedButton = document.getElementById("proceedButton");
const cashoutNowButton = document.getElementById("cashoutNowButton");

// Audio elements
const spinAudio = document.getElementById("dramaticSound");
const winAudio = document.getElementById("winSound");
const loseAudio = document.getElementById("loseSound");
spinAudio.loop = false;
spinAudio.volume = 0.7;
winAudio.volume = 0.8;
loseAudio.volume = 0.8;

// Initialize UI
updateUI();

// Event listeners
document.getElementById("spinButton").addEventListener("click", spinWheel);
cashoutButton.addEventListener('click', () => {
  EliminationRounds.cashout();
});

// Coin purchase
document.querySelectorAll('.coin-package').forEach(package => {
  package.addEventListener('click', () => {
    const coins = parseInt(package.dataset.coins);
    const price = parseInt(package.dataset.price);
    EliminationRounds.buyCoins(coins, price);
    showWinPopup(`Purchased ${coins} coins!`);
  });
});

// Round 3 warning handlers
proceedButton.addEventListener('click', () => {
  round3Warning.style.display = 'none';
  spinWheel();
});

cashoutNowButton.addEventListener('click', () => {
  round3Warning.style.display = 'none';
  EliminationRounds.cashout();
});

function updateUI() {
  document.getElementById('coinBalance').textContent = EliminationRounds.getCoins();
  document.getElementById('tkBalance').textContent = EliminationRounds.getTK();
  document.getElementById('currentRound').textContent = EliminationRounds.getCurrentRound();
  document.getElementById('progressFill').style.width = `${EliminationRounds.getCurrentRound() * 33 - 33}%`;
}

function drawWheel(highlightIndex = null) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);

  // Draw wheel background
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();
  
  // Draw segments
  for (let i = 0; i < segments; i++) {
    const startAngle = i * anglePerSegment;
    const endAngle = startAngle + anglePerSegment;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();

    ctx.fillStyle = colorMap[segmentColors[i]];
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const textAngle = startAngle + anglePerSegment / 2;
    const x = Math.cos(textAngle) * (radius * 0.65);
    const y = Math.sin(textAngle) * (radius * 0.65);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(textAngle);
    ctx.fillStyle = "white";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(segmentColors[i].charAt(0).toUpperCase(), 0, 0);
    ctx.restore();
  }

  // Highlight winning segment
  if (highlightIndex !== null) {
    const startAngle = highlightIndex * anglePerSegment;
    const endAngle = startAngle + anglePerSegment;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, startAngle, endAngle);
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#00ff88";
    ctx.stroke();
  }

  // Draw center circle
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#16213e';
    ctx.fill();
    ctx.strokeStyle = "#ff00aa";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();

    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 15);
    ctx.lineTo(centerX - 15, centerY - radius - 40);
    ctx.lineTo(centerX + 15, centerY - radius - 40);
    ctx.closePath();
    ctx.fillStyle = "#ff4444";
    ctx.fill();
    ctx.strokeStyle = "#cc0000";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Pointer decoration
    ctx.beginPath();
    ctx.arc(centerX, centerY - radius - 40, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#ff0000";
    ctx.fill();
}

function showWinPopup(message) {
  winPopup.querySelector('.popup-content').innerHTML = message;
  winPopup.style.display = "block";
  playSound(winAudio);
  
  // Create confetti
  createConfetti(winPopup);
  
  setTimeout(() => {
    winPopup.style.display = "none";
  }, 5000);
}

function showLoosePopup(message) {
  LoosePopup.querySelector('.popup-content').innerHTML = message;
  LoosePopup.style.display = "block";
  playSound(loseAudio);
  
  setTimeout(() => {
    LoosePopup.style.display = "none";
  }, 5000);
}

function playSound(audio) {
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function createConfetti(container) {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  
  for (let i = 0; i < 150; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.width = Math.random() * 10 + 5 + 'px';
    confetti.style.height = Math.random() * 10 + 5 + 'px';
    container.appendChild(confetti);
    
    // Animate confetti
    const animation = confetti.animate([
      { top: '0%', opacity: 1, transform: 'rotate(0deg)' },
      { top: '100%', opacity: 0, transform: `rotate(${Math.random() * 720}deg)` }
    ], {
      duration: Math.random() * 2000 + 2000,
      easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)'
    });
    
    animation.onfinish = () => confetti.remove();
  }
}

function spinWheel() {
  if (spinning) return;
  
  const betAmount = parseFloat(betInput.value);
  const selectedColor = colorSelect.value;
  const currentRound = EliminationRounds.getCurrentRound();
  
  // For first spin of a session
  if (currentRound === 1) {
    if (!EliminationRounds.startSession(betAmount, selectedColor)) {
      return;
    }
  }

  // Show round 3 warning
  if (currentRound === 2) {
    round3Warning.style.display = 'block';
    return;
  }

  spinning = true;
  spinButton.disabled = true;
  cashoutButton.disabled = true;
  spinButton.textContent = "SPINNING...";

  // Determine outcome before animation
  const isWin = EliminationRounds.determineOutcome();
  
  // Force wheel to land appropriately
  if (isWin) {
    // Find segment matching selected color
    const winningSegments = segmentColors
      .map((color, i) => (color === selectedColor ? i : -1))
      .filter(i => i !== -1);
    
    stopSegmentIndex = winningSegments[Math.floor(Math.random() * winningSegments.length)];
  } else {
    // Find losing segment
    const losingSegments = segmentColors
      .map((color, i) => (color !== selectedColor ? i : -1))
      .filter(i => i !== -1);
    
    stopSegmentIndex = losingSegments[Math.floor(Math.random() * losingSegments.length)];
  }

  const extraSpins = 4 + (currentRound * 1);
  const segmentCenter = stopSegmentIndex * anglePerSegment + anglePerSegment / 2;
  const startRotation = rotation;
  const targetRotation =
    (3 * Math.PI / 2 - segmentCenter + 2 * Math.PI) % (2 * Math.PI) +
    extraSpins * 2 * Math.PI;

  spinStartTime = null;
  wheelContainer.classList.add("spinning");
  playSound(spinAudio);

  function animate(timestamp) {
    if (!spinStartTime) spinStartTime = timestamp;
    const elapsed = timestamp - spinStartTime;
    const t = Math.min(elapsed / spinDuration, 1);
    const easeOut = 1 - Math.pow(1 - t, 4);
    rotation = startRotation + (targetRotation - startRotation) * easeOut;
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      rotation %= (2 * Math.PI);
      drawWheel(stopSegmentIndex);
      wheelContainer.classList.remove("spinning");

      const resultColor = segmentColors[stopSegmentIndex];
      let message = `Round ${currentRound}: Landed on ${resultColor.toUpperCase()}<br>`;

      if (isWin) {
        const winnings = EliminationRounds.handleWin();
        if (winnings > 0) {
          message += `🎉 WIN! +${winnings} TK`;
        } else {
          message += `✅ ADVANCE TO ROUND ${currentRound + 1}!`;
        }
        showWinPopup(message);
      } else {
        EliminationRounds.handleLoss();
        message += `💀 ELIMINATED!`;
        showLoosePopup(message);
      }

      spinButton.disabled = false;
      cashoutButton.disabled = false;
      spinButton.textContent = currentRound > 3 ? "NEW SESSION" : "SPIN AGAIN";
      updateUI();
    }
  }

  requestAnimationFrame(animate);
}

// Initial draw
drawWheel();
updateUI();