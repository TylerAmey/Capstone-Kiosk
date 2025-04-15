const socket = io();

let currentPlayer = null;
let playerReady = { P1: false, P2: false };

const categories = ['New Media Design', 'Game Show History', 'Rochester NY', 'RIT'];
const values = [400, 800, 1200];

// DOM Elements
const startBtn = document.getElementById('startBtn');
const p1Card = document.querySelector('.player1');
const p2Card = document.querySelector('.player2');
const p1Circle = p1Card.querySelector('.circle');
const p2Circle = p2Card.querySelector('.circle');

// Player click logic (toggle on/off)
p1Circle.addEventListener('click', () => {
  playerReady.P1 = !playerReady.P1;
  p1Card.classList.toggle('ready', playerReady.P1);
  if (playerReady.P1) {
    currentPlayer = 'P1';
  } else if (!playerReady.P2) {
    currentPlayer = null;
  }
  checkReady();
  updateStartButton();
});

p2Circle.addEventListener('click', () => {
  playerReady.P2 = !playerReady.P2;
  p2Card.classList.toggle('ready', playerReady.P2);
  if (playerReady.P2) {
    currentPlayer = 'P2';
  } else if (!playerReady.P1) {
    currentPlayer = null;
  }
  checkReady();
  updateStartButton();
});

// Allow start with at least one player ready
function checkReady() {
  const someoneReady = playerReady.P1 || playerReady.P2;
  startBtn.disabled = !someoneReady;
}

// Update start button styling based on selected players
function updateStartButton() {
  if (playerReady.P1 && !playerReady.P2) {
    startBtn.style.borderColor = '#ff00ff';
    startBtn.style.color = '#ff00ff';
  } else if (playerReady.P2 && !playerReady.P1) {
    startBtn.style.borderColor = '#00ffff';
    startBtn.style.color = '#00ffff';
  } else if (playerReady.P1 && playerReady.P2) {
    startBtn.style.borderColor = 'white';
    startBtn.style.color = 'white';
  } else {
    startBtn.style.borderColor = 'gray';
    startBtn.style.color = 'gray';
  }
}

// Transition to Jeopardy board
startBtn.addEventListener('click', () => {
  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('board-screen').classList.remove('hidden');
  buildBoard();
  showPlayerIcons();
});

// Build the Jeopardy board
function buildBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  categories.forEach(cat => {
    const header = document.createElement('div');
    header.className = `cell ${cat.toLowerCase().replace(/\s+/g, '')} category-header`;
    header.textContent = cat;
    board.appendChild(header);
  });

  values.forEach(value => {
    categories.forEach(cat => {
      const cell = document.createElement('button');
      cell.className = `cell ${cat.toLowerCase().replace(/\s+/g, '')} value-button`;
      cell.textContent = value;
      cell.addEventListener('click', () => {
        if (!currentPlayer) return alert("Select a player first!");
        
        const color = currentPlayer === 'P1' ? '#ff00ff' : '#00ffff';
      
        // Visually mark the button as taken
        cell.style.backgroundColor = color;
        cell.style.color = 'black';
      
        // Hide board screen and show question screen
        document.getElementById('board-screen').classList.add('hidden');
        document.getElementById('question-screen').classList.remove('hidden');
      
        // Update info
        document.getElementById('picked-info').textContent = `Selected ${cat} for $${value}`;
      
        // Update player icons
        const p1Icon = document.getElementById('icon-p1');
        const p2Icon = document.getElementById('icon-p2');
      
        if (playerReady.P1) {
          p1Icon.style.color = '#ff00ff';
          p1Icon.style.borderColor = '#ff00ff';
        }

        if (playerReady.P2) {
          p2Icon.style.color = '#00ffff';
          p2Icon.style.borderColor = '#00ffff';
        }

        socket.emit('getQuestion', {
          category: cat,
          value,
          player1: playerReady.P1,
          player2: playerReady.P2
        });  

      });      

      board.appendChild(cell);
    });
  });

  document.getElementById('randomBtn').addEventListener('click', () => {
    if (!currentPlayer) return alert("Select a player first!");
  
    socket.emit('getRandomQuestion', {
      player1: playerReady.P1,
      player2: playerReady.P2
    });

  });
  
}

// Add icons to board screen to show signed-in players
function showPlayerIcons() {
  const boardScreen = document.getElementById('board-screen');

  const iconStyle = (color) => `
    position: absolute;
    top: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: ${color};
    border: 2px solid ${color};
  `;

  if (!document.getElementById('p1Icon')) {
    const p1Icon = document.createElement('div');
    p1Icon.id = 'p1Icon';
    p1Icon.textContent = 'P1';
    p1Icon.style.cssText = iconStyle(playerReady.P1 ? '#ff00ff' : '#555') + 'left: 20px;';
    boardScreen.appendChild(p1Icon);
  }

  if (!document.getElementById('p2Icon')) {
    const p2Icon = document.createElement('div');
    p2Icon.id = 'p2Icon';
    p2Icon.textContent = 'P2';
    p2Icon.style.cssText = iconStyle(playerReady.P2 ? '#00ffff' : '#555') + 'right: 20px;';
    boardScreen.appendChild(p2Icon);
  }
}

socket.on('questionSent', ({ question, category, value }) => {
  // Hide Jeopardy board
  document.getElementById('board-screen').classList.add('hidden');
  
  // Show question screen
  const questionScreen = document.getElementById('question-screen');
  questionScreen.classList.remove('hidden');

  // Update picked category/value display
  const pickedInfo = document.getElementById('picked-info');
  pickedInfo.textContent = `Selected ${category} for ${value}!`;

  // Set icons' color based on which player triggered it
  const p1Icon = document.getElementById('icon-p1');
  const p2Icon = document.getElementById('icon-p2');
  p1Icon.style.color = playerReady.P1 ? '#ff00ff' : '#555';
  p2Icon.style.color = playerReady.P2 ? '#00ffff' : '#555';
  p1Icon.style.borderColor = playerReady.P1 ? '#ff00ff' : '#555';
  p2Icon.style.borderColor = playerReady.P2 ? '#00ffff' : '#555';

  // Show question
  const display = document.getElementById('question-display');
  display.textContent = "";
});

