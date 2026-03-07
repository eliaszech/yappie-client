import { useState, useEffect } from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import MessagesLayout from "./layouts/MessagesLayout.jsx";
import ServerSelector from "./features/servers/ServerSelector.jsx";
import FriendsList from "./features/private/friends/FriendsList.jsx";
import AddFriend from "./features/private/friends/AddFriend.jsx";
import FriendsLayout from "./features/private/friends/FriendsLayout.jsx";
import LastPathRedirect from "./features/components/LastPathRedirect.jsx";
import UserPanel from "./features/components/UserPanel.jsx";

function App() {

    return (
        <BrowserRouter>
            <div className="min-h-screen flex antialiased">
                <ServerSelector />
                <div className="relative flex bg-guild-bar w-full h-screen">
                    <Routes>
                        <Route path="/" element={<Navigate to="/@me/friends" replace />} />
                        <Route path="/@me" element={<MessagesLayout />} >
                            <Route index element={<LastPathRedirect pathKey="messages" defaultPath="/@me/friends" />} />
                            <Route path="friends" element={<FriendsLayout />} >
                                <Route index element={<LastPathRedirect pathKey="friends" defaultPath="/@me/friends/online" />} />
                                <Route path="online" element={<FriendsList filter="online" />} />
                                <Route path="all" element={<FriendsList filter="all" />} />
                                <Route path="add" element={<AddFriend />} />
                            </Route>
                            <Route path="quests" element={<div>Quests</div>} />
                        </Route>
                    </Routes>
                </div>
                <UserPanel />
            </div>
        </BrowserRouter>
    );
}

export default App;