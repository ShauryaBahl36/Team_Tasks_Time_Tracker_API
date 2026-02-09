import { Outlet, Navigate } from 'react-router-dom';
import React from 'react';

export default function PrivateRoutes() {
    const token = localStorage.getItem("access")
    return (
        token ?
            <Outlet /> :
            <Navigate to="/" />
    )
}