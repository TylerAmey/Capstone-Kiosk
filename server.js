const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const questions = require('./question-data');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Client connected');
  //Pick a random question from the selected category and emit it over to Unity and Kinect servers
  socket.on('getQuestion', ({ category, value, player1, player2 }) => {
    const list = questions.categories[category.replace(/\s+/g, '')][value];
    const random = list[Math.floor(Math.random() * list.length)];
    io.emit('questionSent', { question: random, category, value, player1, player2 });
  });
  //Pick a random question from any category emit it over to Unity and Kinect servers
  socket.on('getRandomQuestion', ({ player1, player2 }) => {
    const cats = Object.keys(questions.categories);
    const randCat = cats[Math.floor(Math.random() * cats.length)];
    const values = Object.keys(questions.categories[randCat]);
    const randValue = values[Math.floor(Math.random() * values.length)];
    const randList = questions.categories[randCat][randValue];
    const randQuestion = randList[Math.floor(Math.random() * randList.length)];
    io.emit('questionSent', { question: randQuestion, category: randCat, value: randValue, player1, player2});
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
