import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import MessagesLayout from "./layouts/MessagesLayout.jsx";
import ServerSelector from "./features/servers/ServerSelector.jsx";
import FriendsList from "./features/private/friends/FriendsList.jsx";
import AddFriend from "./features/private/friends/AddFriend.jsx";
import FriendsLayout from "./features/private/friends/FriendsLayout.jsx";
import LastPathRedirect from "./features/components/LastPathRedirect.jsx";
import UserPanel from "./features/components/UserPanel.jsx";
import Conversation from "./features/private/friends/Conversation.jsx";
import MessagesSidebar from "./features/private/MessagesSidebar.jsx";
import ProtectedRoute from "./features/components/ProtectedRoute.jsx";
import Login from "./features/auth/Login.jsx";
import GuestRoute from "./features/components/GuestRoute.jsx";

function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute>Register</GuestRoute>} />
                <Route path="/*" element={
                    <ProtectedRoute>
                        <div className="h-screen flex antialiased">
                            <div className="flex flex-col h-screen shrink-0">
                                <div className="flex h-full">
                                    <ServerSelector />
                                    <Routes>
                                        <Route path="/@me/*" element={<MessagesSidebar />} />
                                    </Routes>
                                </div>
                                <UserPanel />
                            </div>
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
                                    <Route path="messages/:conversationId" element={<Conversation />} />
                                    <Route path="quests" element={<div>Quests</div>} />
                                </Route>
                            </Routes>
                        </div>
                    </ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default App;