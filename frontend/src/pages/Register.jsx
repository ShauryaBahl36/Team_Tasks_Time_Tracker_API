"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';


export default function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    async function handleSubmit() {
        try {
            if (!email || !username || !password){
                return "Please enter the respective credentials"
            }
            const payload = {
                email: email,
                username: username,
                password: password
            }
            const response = await axios.post("http://localhost:8000/auth/register/", payload)
            console.log(response.data)
            alert("User registered successfully")
            navigate("/")
        } catch(error) {
            console.log(error.response?.data || error.message);
            alert("Registration failed")
        }
    }
    return (
        <>
            <h2>Register Page</h2>
            <label>Email: </label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} /><br /><br />
            <label>Username: </label>
            <input type="text" value={username} onChange={(e)=>setUsername(e.target.value)} /><br /><br />
            <label>Password: </label>
            <input type="password" value={password} onChange={(e)=> setPassword(e.target.value)} /><br /><br />
            <Link to="/">Login</Link><br /><br />
            <button onClick={handleSubmit}>Register</button>
        </>
    )
}
