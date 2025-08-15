import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import OceanWorld from "./pages/InfoDetail/OceanWorld";

function App() {
    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        <div className="app-container">
                            <div className="box-container">
                                <Link to="/OceanWorld" className="box">
                                    제휴 정보
                                </Link>
                            </div>
                        </div>
                    }
                />
                <Route path="/OceanWorld" element={<OceanWorld />} />
            </Routes>
        </Router>
    );
}

export default App;
