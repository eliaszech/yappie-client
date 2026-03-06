import { useState, useEffect } from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import MessagesLayout from "./layouts/MessagesLayout.jsx";
import ServerSelector from "./features/servers/ServerSelector.jsx";
import FriendsList from "./features/private/FriendsList.jsx";

function App() {

    return (
        <BrowserRouter>
            <div className="min-h-screen flex antialiased">
                <ServerSelector />
                <div className="flex bg-guild-bar w-full h-screen">
                    <Routes>
                        <Route path="/" element={<Navigate to="/@me/friends" replace />} />
                        <Route path="/@me" element={<MessagesLayout />} >
                            <Route index element={<Navigate to="/@me/friends" replace />} />
                            <Route index path="friends" element={<FriendsList />} />
                            <Route path="quests" element={<div>Quests</div>} />
                        </Route>
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;