const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

app.use(express.static('public'));

let gameState = {
  teams: [
    { name: '第一小隊', cash: 0, virtualCurrency: 0 },
    { name: '第二小隊', cash: 0, virtualCurrency: 0 },
    { name: '第三小隊', cash: 0, virtualCurrency: 0 },
    { name: '第四小隊', cash: 0, virtualCurrency: 0 },
    { name: '第五小隊', cash: 0, virtualCurrency: 0 },
    { name: '第六小隊', cash: 0, virtualCurrency: 0 }
  ],
  virtualCurrencyValue: 0
};

//讀取保存的遊戲狀態
function loadGameState() {
  try {
    const data = fs.readFileSync('gameState.json', 'utf8');
    gameState = JSON.parse(data);
    console.log('Loaded game state:', gameState);
  } catch (err) {
    console.log('No saved game state found, using default');
  }
}

// 保存遊戲狀態
function saveGameState() {
  fs.writeFileSync('gameState.json', JSON.stringify(gameState), 'utf8');
  console.log('Game state saved');
}

// 載入保存的遊戲狀態
loadGameState();

io.on('connection', (socket) => {
  console.log('A user connected');

  // 發送初始給客戶端
  socket.on('requestInitialData', () => {
    socket.emit('initialData', gameState);
  });

  // 處理更新
  socket.on('update', (data) => {
    console.log('Received update:', data);
    const { team, type, amount } = data;
    const teamIndex = gameState.teams.findIndex(t => t.name === team);
    
    if (teamIndex !== -1) {
      if (type === '現金') {
        gameState.teams[teamIndex].cash = parseFloat((gameState.teams[teamIndex].cash + parseFloat(amount)).toFixed(2));
      } else if (type === '虛擬貨幣') {
        gameState.teams[teamIndex].virtualCurrency = parseFloat((gameState.teams[teamIndex].virtualCurrency + parseFloat(amount)).toFixed(2));
      }
      
      console.log('Updated game state:', gameState);
      
      // 廣播更新给所有客戶端
      io.emit('update', gameState);
      
      // 保存更新後的遊戲狀態
      saveGameState();
    }
  });

  // 虛擬貨幣更新
  socket.on('updateVirtualCurrencyValue', (newValue) => {
    console.log('Updating virtual currency value:', newValue);
    gameState.virtualCurrencyValue = parseFloat(newValue);
    
    console.log('Updated game state:', gameState);
    
    // 廣播更新给所有客戶端
    io.emit('update', gameState);
    
    // 保存更新的遊戲狀態
    saveGameState();
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
