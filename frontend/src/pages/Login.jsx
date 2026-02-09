import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    async function handleSubmit() {
        try {
            if (!username || !password){
                alert("Please enter Username or Password")
            }
            const payload = {
                "username": username,
                "password": password
            }
            const response = await axios.post("http://localhost:8000/auth/login/", payload)
            console.log(response)
            navigate("/home")
        
        } catch(error){
            console.log(error.response?.data || error.message);
            alert("Invalid Username or password")
        }
    }

    return (
        <>
            <h2>Login Page</h2>
            <label>Username </label>
            <input type="text" value={username} onChange={(e)=>setUsername(e.target.value)} /><br /><br />
            <label>Password </label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /><br /><br />
            <Link to="/register">Register</Link><br />
            <button onClick={handleSubmit}>Login</button>
        </>
    )
}
