// =============================
// PROGRESSIVE KNOCKOUT BET SYSTEM
// =============================
const EliminationRounds = (function() {
  // Configuration
  const HOUSE_EDGE = 0.15; // 15% house advantage
  const MIN_BET = 1;
  const INITIAL_BALANCE = 100;
  
  // State
  let balance = INITIAL_BALANCE;
  let currentRound = 1;
  let sessionBet = 0;
  let sessionMultiplier = 1;
  let sessionPot = 0;
  let sessionProgress = 0;
  let selectedColor = '';
  let cashoutAvailable = false;
  
  // Profit tracking system
  let houseProfit = 0;
  let playerProfit = 0;
  
  // Round difficulty progression
  const roundConfig = {
    1: { winProbability: 0.50, payoutMultiplier: 1.0 },
    2: { winProbability: 0.35, payoutMultiplier: 1.5 },
    3: { winProbability: 0.20, payoutMultiplier: 2.0 }
  };
  
  // Color-specific payouts
  const colorPayouts = {
    red: 1.80,
    black: 1.70,
    gold: 7.00
  };
  
  // Update UI elements
  const updateUI = function() {
    document.getElementById('balanceDisplay').textContent = balance.toFixed(2);
    document.getElementById('currentRound').textContent = currentRound;
    document.getElementById('potentialWin').textContent = (sessionPot * sessionMultiplier).toFixed(2);
    document.getElementById('roundInfo').textContent = `Session Progress: ${sessionProgress}%`;
    

    
    // Show/hide cashout button
    const cashoutBtn = document.getElementById('cashoutButton');
    cashoutBtn.style.display = cashoutAvailable ? 'inline-block' : 'none';
  };
  
  // Track player profit (wins and losses)
  const trackPlayerProfit = function(amount, isWin) {
    if (isWin) {
      playerProfit += amount;
    } else {
      playerProfit -= amount;
    }
  };
  
  // Track house profit
  const trackHouseProfit = function(amount) {
    houseProfit += amount;
  };
  
  // Start a new session
  const startSession = function(amount, color) {
    if (amount < MIN_BET) {
      showLoosePopup(`Minimum bet is $${MIN_BET}`);
      return false;
    }
    
    if (amount > balance) {
      showLoosePopup("Insufficient balance!");
      return false;
    }
    
    // Deduct bet from balance
    balance -= amount;
    sessionBet = amount;
    sessionPot = amount;
    sessionMultiplier = 1;
    currentRound = 1;
    sessionProgress = 0;
    selectedColor = color;
    cashoutAvailable = false;
    
    // Track initial bet as player loss until proven otherwise
    trackPlayerProfit(-amount, false);
    
    updateUI();
    return true;
  };
  
  // Advance to next round
  const advanceRound = function() {
    currentRound++;
    sessionProgress = Math.min(100, sessionProgress + 33);
    
    // Apply round multiplier to pot
    sessionMultiplier *= roundConfig[currentRound - 1].payoutMultiplier;
    sessionPot = sessionBet * sessionMultiplier;
    
    // Enable cashout after round 2
    if (currentRound === 3) {
      cashoutAvailable = true;
    }
    
    updateUI();
  };
  
  // Handle cashout
  const cashout = function() {
    const winnings = sessionPot;
    balance += winnings;
    
    // Update profit tracking
    trackPlayerProfit(winnings, true);
    
    showWinPopup(
      `Cashed out!<br>+$${winnings.toFixed(2)}<br>Multiplier: ${sessionMultiplier.toFixed(2)}x`
    );
    
    resetSession();
    return winnings;
  };
  
  // Handle win
  const handleWin = function() {
    advanceRound();
    
    // If final round won
    if (currentRound > 3) {
      const winnings = sessionPot * 4; // 4x multiplier for final win
      balance += winnings;
      
      // Update profit tracking
      trackPlayerProfit(winnings, true);
      
      showWinPopup(
        `JACKPOT!<br>+$${winnings.toFixed(2)}<br>Final Multiplier: ${(sessionMultiplier * 4).toFixed(2)}x`
      );
      
      resetSession();
      return winnings;
    }
    
    return 0;
  };
  
  // Handle loss
  const handleLoss = function() {
    // Track house profit (the entire session pot)
    trackHouseProfit(sessionPot);
    
    showLoosePopup(
      `Round ${currentRound} Failed!<br>You lost $${sessionBet}<br>Total Loss: $${sessionPot.toFixed(2)}`
    );
    
    resetSession();
    return sessionPot;
  };
  
  // Reset session
  const resetSession = function() {
    sessionBet = 0;
    sessionPot = 0;
    sessionMultiplier = 1;
    currentRound = 1;
    sessionProgress = 0;
    cashoutAvailable = false;
    updateUI();
  };
  
  // Determine round outcome
  const determineOutcome = function() {
    const round = currentRound;
    const baseProbability = roundConfig[round].winProbability;
    
    // Apply house advantage
    const effectiveProbability = baseProbability * (1 - HOUSE_EDGE);
    
    // Apply color weight
    let colorWeight = 1.0;
    if (selectedColor === 'black') colorWeight = 0.95;
    if (selectedColor === 'gold') colorWeight = 0.85;
    
    const winThreshold = effectiveProbability * colorWeight;
    const isWin = Math.random() < winThreshold;
    
    return isWin;
  };
  
  // Public API
  return {
    startSession,
    cashout,
    determineOutcome,
    handleWin,
    handleLoss,
    getCurrentRound: () => currentRound,
    getSessionPot: () => sessionPot,
    getBalance: () => balance,
    getColorPayouts: () => colorPayouts,
    getHouseProfit: () => houseProfit,
    getPlayerProfit: () => playerProfit,
    resetProfits: function() {
      houseProfit = 0;
      playerProfit = 0;
      updateUI();
    }
  };
})();


// =====================
// MODIFIED WHEEL CODE
// =====================
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 180;
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
const spinDuration = 5000; // Reduced to 5 seconds for faster rounds

const betInput = document.getElementById("betInput");
const winPopup = document.getElementById("winPopup");
const LoosePopup = document.getElementById("LoosePopup");
const spinButton = document.getElementById("spinButton");
const wheelContainer = document.getElementById("wheelContainer");
const colorSelect = document.getElementById("colorSelect");
const cashoutButton = document.getElementById("cashoutButton");

const bgAudio = document.getElementById("dramaticSound");
bgAudio.loop = false;
bgAudio.volume = 1.0;

// Initialize UI
const payouts = EliminationRounds.getColorPayouts();
document.getElementById('redPayout').textContent = 'x' + payouts.red;
document.getElementById('blackPayout').textContent = 'x' + payouts.black;
document.getElementById('goldPayout').textContent = 'x' + payouts.gold;




// Cashout functionality
cashoutButton.addEventListener('click', () => {
  EliminationRounds.cashout();
});

function stopMusic() {
  bgAudio.pause();
  bgAudio.currentTime = 0;
}

function playSpinMusic() {
  stopMusic();
  bgAudio.play().catch(() => {});
}

function drawWheel(highlightIndex = null) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);

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
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    const textAngle = startAngle + anglePerSegment / 2;
    const x = Math.cos(textAngle) * (radius * 0.65);
    const y = Math.sin(textAngle) * (radius * 0.65);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(textAngle);
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(segmentColors[i].charAt(0).toUpperCase(), 0, 0);
    ctx.restore();
  }

  if (highlightIndex !== null) {
    const startAngle = highlightIndex * anglePerSegment;
    const endAngle = startAngle + anglePerSegment;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, startAngle, endAngle);
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#00ff88";
    ctx.stroke();
  }

  ctx.restore();

  // Draw pointer
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius - 15);
  ctx.lineTo(centerX - 12, centerY - radius - 35);
  ctx.lineTo(centerX + 12, centerY - radius - 35);
  ctx.closePath();
  ctx.fillStyle = "#ff4444";
  ctx.fill();
  ctx.strokeStyle = "#cc0000";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function showWinPopup(message) {
  winPopup.innerHTML = message;
  winPopup.style.display = "block";
  setTimeout(() => {
    winPopup.style.display = "none";
  }, 5000);
}

function showLoosePopup(message) {
  LoosePopup.innerHTML = message;
  LoosePopup.style.display = "block";
  setTimeout(() => {
    LoosePopup.style.display = "none";
  }, 5000);
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

  const extraSpins = 5 + (currentRound * 2); // More spins in later rounds
  const segmentCenter = stopSegmentIndex * anglePerSegment + anglePerSegment / 2;
  const startRotation = rotation;
  const targetRotation =
    (3 * Math.PI / 2 - segmentCenter + 2 * Math.PI) % (2 * Math.PI) +
    extraSpins * 2 * Math.PI;

  spinStartTime = null;
  wheelContainer.classList.add("spinning");
  playSpinMusic();

  function animate(timestamp) {
    if (!spinStartTime) spinStartTime = timestamp;
    const elapsed = timestamp - spinStartTime;
    const t = Math.min(elapsed / spinDuration, 1);
    const easeOut = 1 - Math.pow(1 - t, 3);
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
          message += `🎉 JACKPOT WIN! +$${winnings.toFixed(2)}`;
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
    }
  }

  requestAnimationFrame(animate);
}

drawWheel();
document.getElementById("spinButton").addEventListener("click", spinWheel);