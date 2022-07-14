import { useRef, useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Modal } from "antd";
import { GameContext } from "../context/GameContext";
import {
  setMessage,
  setOpponent,
  setOpponentMoves,
  setPlayer,
  setPlayerColor,
  types,
} from "../context/actions";
import "antd/dist/antd.min.css";
import "./game-styles.css";
import io from "socket.io-client";
import qs from "query-string";

const socket = io("https://socketio-chess-server.herokuapp.com/");

export default function Game() {
  const { current: game } = useRef(new Chess());
  const chessboardRef = useRef();
  const [selectVisible, setSelectVisible] = useState(false);
  const [overVisible, setOverVisible] = useState(false);
  const [pendingMove, setPendingMove] = useState();
  const [moveSquares, setMoveSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});

  const {
    dispatch,
    status,
    turn,
    playerName: player,
    opponentName,
    playerColor,
  } = useContext(GameContext);

  // socket.io part start
  const location = useLocation();
  const navigate = useNavigate();
  const playerName = useRef();
  const gameID = useRef();

  useEffect(() => {
    const { id, name } = qs.parse(location.search);
    playerName.current = name;
    gameID.current = id;
  }, [location.search]);

  useEffect(() => {
    socket.emit(
      "join",
      { name: playerName.current, gameID: gameID.current },
      ({ error, color }) => {
        if (error) {
          navigate("/");
        }
        dispatch(setPlayer(playerName.current));
        dispatch(setPlayerColor(color));
      }
    );
    socket.on("welcome", ({ message, opponent }) => {
      console.log({ message, opponent });
      dispatch(setMessage(message));
      dispatch(setOpponent(opponent));
    });
    socket.on("opponentJoin", ({ message, opponent }) => {
      console.log({ message, opponent });
      dispatch(setMessage(message));
      dispatch(setOpponent(opponent));
    });
    socket.on("gameReset", () => {
      game.reset();
      setMoveSquares({});
      console.log("board reset");
      dispatch(setMessage("Board Reset"));
    });
    socket.on("opponentMove", ({ from, to, promotion }) => {
      movePiece(from, to, promotion);
      console.log({ from, to, promotion });
      dispatch(setMessage("Your Turn"));
      dispatch(setOpponentMoves([from, to]));
    });
    socket.on("message", ({ message }) => {
      console.log({ message });
      dispatch(setMessage(message));
    });
  }, [game, navigate, dispatch]);
  // socket.io part end

  function checkPawnPromotion(sourceSquare) {
    const moves = game.moves({ verbose: true });
    for (let i = 0, len = moves.length; i < len; i++) {
      if (
        moves[i].flags.indexOf("p") !== -1 &&
        moves[i].from === sourceSquare
      ) {
        return true;
      }
    }
    return false;
  }

  function movePiece(sourceSquare, targetSquare, p) {
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: p,
    });
    if (move != null) {
      socket.emit("move", {
        gameID: gameID.current,
        from: sourceSquare,
        to: targetSquare,
        promotion: p,
      });
    }
    const [gameOver, status] = getGameOverState(game);
    if (gameOver) {
      dispatch({ type: types.GAME_OVER, status, player: game.turn() });
      setOverVisible(true);
      return;
    }
    dispatch({
      type: types.SET_TURN,
      player: game.turn(),
      check: game.in_check(),
    });
    return move === null;
  }

  function onDrop(sourceSquare, targetSquare) {
    if (
      player === undefined ||
      opponentName === undefined ||
      game.turn() !== playerColor
    ) {
      return false;
    } else if (checkPawnPromotion(sourceSquare)) {
      setPendingMove([sourceSquare, targetSquare]);
      setSelectVisible(true);
    } else if (movePiece(sourceSquare, targetSquare, "x")) {
      return false;
    }

    setMoveSquares({
      [sourceSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
      [targetSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
    });

    return true;
  }

  function promotion(e) {
    movePiece(pendingMove[0], pendingMove[1], e);
    setSelectVisible(false);
  }

  function onMouseOverSquare(square) {
    getMoveOptions(square);
  }

  function onMouseOutSquare() {
    if (Object.keys(optionSquares).length !== 0) setOptionSquares({});
  }

  function getMoveOptions(square) {
    const moves = game.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      return;
    }

    const newSquares = {};
    moves.map((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to) &&
          game.get(move.to).color !== game.get(square).color
            ? "radial-gradient(circle, rgba(100,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
      return move;
    });
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };
    setOptionSquares(newSquares);
  }

  function getGameOverState(chess) {
    if (!chess.game_over()) {
      return [false, ""];
    } else if (chess.in_checkmate()) {
      return [true, "checkmate"];
    } else if (chess.in_stalemate()) {
      return [true, "stalemate"];
    } else if (chess.in_threefold_repetition()) {
      return [true, "three fold repetition"];
    } else {
      return [true, "draw"];
    }
  }

  function handleReset() {
    game.reset();
    chessboardRef.current.clearPremoves();
    setMoveSquares({});
    setOverVisible(false);
    socket.emit("reset", {
      gameID: gameID.current,
    });
  }

  return (
    <div className="container">
      <h1 className="text-white text-center">Queen's Gambit</h1>
      <div id="Hash" className="my-3">
        <h2 style={{ color: "yellow" }}>
          {playerColor === "w" ? "White" : "Black"}: {player}
        </h2>
        <h2 style={{ color: "yellow" }}>
          {playerColor === "w" ? "Black" : "White"}: {opponentName}
        </h2>
      </div>
      <div className="flex-center">
        <Chessboard
          id="SquareStyles"
          animationDuration={200}
          boardOrientation={playerColor === "w" ? "white" : "black"}
          boardWidth={800}
          position={game.fen()}
          onMouseOverSquare={onMouseOverSquare}
          onMouseOutSquare={onMouseOutSquare}
          onPieceDrop={onDrop}
          customBoardStyle={{
            borderRadius: "4px",
            boxShadow: "0 5px 28px rgba(0, 0, 0, 25)",
            outline: "13px solid #663006",
          }}
          customSquareStyles={{
            ...moveSquares,
            ...optionSquares,
          }}
          ref={chessboardRef}
        />

        <Modal visible={selectVisible} footer={null} closable={false}>
          <span role="presentation" onClick={() => promotion("q")}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/49/Chess_qlt60.png"
              alt=""
              style={{ width: 115 }}
            />
          </span>
          <span role="presentation" onClick={() => promotion("r")}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Chess_rdt60.png"
              alt=""
              style={{ width: 115 }}
            />
          </span>
          <span role="presentation" onClick={() => promotion("b")}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/9/9b/Chess_blt60.png"
              alt=""
              style={{ width: 115 }}
            />
          </span>
          <span role="presentation" onClick={() => promotion("n")}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Chess_ndt60.png"
              alt=""
              style={{ width: 115 }}
            />
          </span>
        </Modal>

        <Modal visible={overVisible} footer={null} closable={false}>
          <h1>
            Game ended in a {status}. {turn === "w" ? "Black" : "White"} won.
          </h1>
          <div className="row-fluid center">
            <button className="btn btn-danger m-4" onClick={handleReset}>
              rematch
            </button>
            <button
              className="btn btn-outline-warning m-4"
              onClick={() => {
                navigate("/");
              }}
            >
              Main menu
            </button>
          </div>
        </Modal>

        <div className="row-fluid">
          <button className="btn btn-danger m-4" onClick={handleReset}>
            reset
          </button>
          <button
            className="btn btn-outline-warning m-4"
            onClick={() => {
              game.undo();
              chessboardRef.current.clearPremoves();
              setMoveSquares({});
            }}
          >
            undo
          </button>
        </div>
      </div>
    </div>
  );
}
