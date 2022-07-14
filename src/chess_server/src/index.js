const http = require("http");
const socketio = require("socket.io");
const express = require("express");
const cors = require("cors");
const { addPlayer, game, removePlayer } = require("./game.js");
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const PORT = process.env.PORT;
const io = socketio(server);

io.on("connection", (socket) => {
  socket.on("join", ({ name, gameID }, callback) => {
    const { error, player, opponent } = addPlayer({
      name,
      playerID: socket.id,
      gameID,
    });
    if (error) {
      return callback({ error });
    }
    socket.join(gameID);
    callback({ color: player.color });

    socket.emit("welcome", {
      message: `Hello ${player.name}, Welcome to the game`,
      opponent,
    });

    socket.broadcast.to(player.gameID).emit("opponentJoin", {
      message: `${player.name} has joined the game. `,
      opponent: player,
    });

    if (game(gameID).length >= 2) {
      const white = game(gameID).find((player) => player.color === "w");
      io.to(gameID).emit("message", {
        message: `Let's start the game. White (${white.name}) goes first`,
      });
    }
  });

  socket.on("reset", ({ gameID }) => {
    socket.broadcast.to(gameID).emit("gameReset", {});
  });

  socket.on("move", ({ from, to, gameID, promotion }) => {
    socket.broadcast.to(gameID).emit("opponentMove", { from, to, promotion });
  });

  socket.on("disconnect", () => {
    const player = removePlayer(socket.id);

    if (player) {
      io.to(player.game).emit("message", {
        message: `${player.name} has left the game.`,
      });
      socket.broadcast.to(player.game).emit("opponentLeft");
    }
  });
});

server.listen(PORT, () => console.log("Server running on port " + PORT));
