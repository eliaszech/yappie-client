import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
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
import {usePresence} from "./hooks/usePresence.js";
import {useMessages} from "./hooks/useMessages.js";
import SidebarLayout from "./layouts/SidebarLayout.jsx";
import ServerSidebar from "./features/servers/ServerSidebar.jsx";
import ServerRedirect from "./features/servers/ServerRedirect.jsx";
import Channel from "./features/servers/channels/Channel.jsx";
import GlobalVoiceComponent from "./features/components/GlobalVoiceComponent.jsx";
import {useVoiceEvents} from "./hooks/useVoiceParticipants.js";
import {useDeleteMessage} from "./hooks/messages/useDeleteMessage.js";
import MemberList from "./features/servers/members/MemberList.jsx";
import {useReactMessage} from "./hooks/messages/useReactMessage.js";

function App() {
    usePresence();
    useVoiceEvents();
    useDeleteMessage();
    useReactMessage();
    useMessages();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute>Register</GuestRoute>} />
                <Route path="/*" element={
                    <ProtectedRoute>
                        <GlobalVoiceComponent />
                        <div className="h-screen flex antialiased overflow-hidden bg-guild-bar">
                            <div className="flex flex-col h-screen shrink-0 border-r border-border">
                                <div className="flex h-full">
                                    <ServerSelector />
                                    <div className="max-w-xs min-w-xs w-full h-full">
                                        <Routes>
                                            <Route path="/@me/*" element={<MessagesSidebar />} />
                                            <Route path="/servers/:serverId/*" element={<ServerSidebar />} />
                                        </Routes>
                                    </div>
                                </div>
                                <UserPanel />
                            </div>
                            <Routes>
                                <Route path="/" element={<Navigate to="/@me/friends" replace />} />
                                <Route path="/@me" element={<SidebarLayout />} >
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
                                <Route path="/servers/:serverId" element={<SidebarLayout />}>
                                    <Route index element={<ServerRedirect />} />
                                    <Route path="members" element={<MemberList />} />
                                    <Route path="channels/:channelId" element={<Channel />} />
                                    <Route path="settings" element={<div>Settings</div>} />
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