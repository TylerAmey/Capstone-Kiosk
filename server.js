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
  socket.on('getQuestion', ({ category, value, player1, player2, player1id, player2id }) => {
    const list = questions.categories[category.replace(/\s+/g, '')][value];
    const random = list[Math.floor(Math.random() * list.length)];
    io.emit('questionSent', { question: random, category, value, player1, player2, player1id, player2id });
  });
  //Pick a random question from any category emit it over to Unity and Kinect servers
  socket.on('getRandomQuestion', ({ player1, player2, player1id, player2id }) => {
    const cats = Object.keys(questions.categories);
    const randCat = cats[Math.floor(Math.random() * cats.length)];
    const values = Object.keys(questions.categories[randCat]);
    const randValue = values[Math.floor(Math.random() * values.length)];
    const randList = questions.categories[randCat][randValue];
    const randQuestion = randList[Math.floor(Math.random() * randList.length)];
    io.emit('questionSent', { question: randQuestion, category: randCat, value: randValue, player1, player2, player1id, player2id});
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
