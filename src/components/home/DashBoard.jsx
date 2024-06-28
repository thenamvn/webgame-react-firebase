// DashBoard.js
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashBoard.css";
import { createGame, joinGame } from "../../utils/dashboard";

const DashBoard = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleCreateGame = () => {
    createGame(setRoomId, navigate); // Call createGame function to create a game room
  };

  const handleJoinGame = () => {
    const roomCode = document.getElementById("room-code").value;
    joinGame(roomCode, navigate); // Call joinGame function to join a game room
  };

  return (
    <div className="bg-dashboard">
      <div className="container">
        <h1>WebGame</h1>
        <button className="create-game-btn" onClick={handleCreateGame}>
          <i className="fas fa-gamepad"></i> CREATE GAME
        </button>
        <br />
        <div className="roomClass">
          <input type="text" id="room-code" placeholder="Enter room code" />
          <button className="join-game-btn" onClick={handleJoinGame}>
            <i className="fas fa-user"></i> Join Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashBoard;
