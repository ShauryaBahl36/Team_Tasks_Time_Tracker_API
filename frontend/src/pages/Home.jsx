import React from 'react'
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    function handleLogout() {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        navigate("/");
    }

    return (
        <>
            <h1>Welcome Home</h1>
            <button onClick={handleLogout}>Logout</button>
        </>
    );
}
