import React from 'react'
import { useNavigate, Link } from 'react-router-dom';
import Tasks from '../components/Tasks.jsx'

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
            {/* <nav>
            </nav> */}
            <button onClick={handleLogout}>Logout</button>
            <hr />

            <Tasks />
        </>
    );
}
