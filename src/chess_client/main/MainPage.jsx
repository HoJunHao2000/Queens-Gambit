import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import qs from "query-string";

export default function MainPage() {
  const [name, setName] = useState("");
  const [gameID, setGameID] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { id: inviteID } = qs.parse(location.search);

  useEffect(() => {
    if (inviteID) {
      return setGameID(inviteID);
    }
    const id = Math.random().toString().replace("0.", "");
    setGameID(id);
  }, [inviteID]);

  const handlePlayer = (event) => {
    event.preventDefault();
    if (!(name && gameID)) {
      return;
    }
    navigate(`/game?name=${name}&id=${gameID}`, { replace: true });
  };

  const handleAI = (event) => {
    navigate(`/AI`, { replace: true });
  };

  return (
    <div className="container text-white py-5 h-100">
      <div className="row d-flex justify-content-center align-items-center h-100">
        <div className="col-12 col-md-8 col-lg-6 col-xl-5">
          <div className="card-body p-5 text-center">
            <div className="mb-md-5 mt-md-4 pb-5">
              <h2 className="text-center text-white h1 mb-5 mx-1 mx-md-4 mt-4">
                Queen's Gambit
              </h2>

              <form className="form-outline form-white mb-4">
                <input
                  className="form-control form-control-lg"
                  placeholder="Display Name"
                  value={name}
                  onChange={({ target }) => setName(target.value)}
                />
              </form>

              <h3 className="text-white mt-5">Play against </h3>

              <div className=" text d-grid gap-2 col-7 mx-auto">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleAI}
                >
                  AI
                </button>
                <button
                  className="btn btn-success"
                  type="button"
                  onClick={handlePlayer}
                >
                  Players
                </button>
              </div>
            </div>

            <hr />
            <p>Invite your friend over using this link</p>
            <div>http://localhost:3000/?id={gameID}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
