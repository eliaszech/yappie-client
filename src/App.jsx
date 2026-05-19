import {lazy, Suspense} from 'react';
import {HashRouter, Routes, Route, Navigate} from 'react-router-dom';
import ServerSelector from "./features/servers/ServerSelector.jsx";
import FriendsList from "./features/private/friends/FriendsList.jsx";
import AddFriend from "./features/private/friends/AddFriend.jsx";
import FriendsLayout from "./features/private/friends/FriendsLayout.jsx";
import LastPathRedirect from "./features/components/LastPathRedirect.jsx";
import UserPanel from "./features/components/UserPanel.jsx";
import MessagesSidebar from "./features/private/MessagesSidebar.jsx";
import ProtectedRoute from "./features/components/ProtectedRoute.jsx";
import Login from "./features/auth/Login.jsx";
import GuestRoute from "./features/components/GuestRoute.jsx";
import {usePresence} from "./hooks/usePresence.js";
import {useMessages} from "./hooks/useMessages.js";
import SidebarLayout from "./layouts/SidebarLayout.jsx";
import ServerSidebar from "./features/servers/ServerSidebar.jsx";
import ServerRedirect from "./features/servers/ServerRedirect.jsx";
import GlobalVoiceComponent from "./features/components/GlobalVoiceComponent.jsx";
import {useVoiceEvents} from "./hooks/useVoiceParticipants.js";
import {useDeleteMessage} from "./hooks/messages/useDeleteMessage.js";
import {useEditMessage} from "./hooks/messages/useEditMessage.js";
import {useReactMessage} from "./hooks/messages/useReactMessage.js";
import Register from "./features/auth/Register.jsx";
import FriendsListPending from "./features/private/friends/FriendsListPending.jsx";
import {useFriendRequests} from "./hooks/friends/useFriendRequests.js";
import {useReadStates} from "./hooks/useReadStates.js";
import {usePinSubscription} from "./hooks/messages/usePinSubscription.js";
import {usePollSubscription} from "./hooks/messages/usePollSubscription.js";
import {useConversationEvents} from "./hooks/useConversationEvents.js";
import {useNotifications} from "./hooks/useNotifications.js";
import {useBadgeCount} from "./hooks/useBadgeCount.js";
import {useUserServerUpdate} from "./hooks/server/useUserServerUpdate.js";
import {useActivitySubscription, useGameActivityReporter} from "./hooks/useActivity.js";
import {useCrashReporter} from "./hooks/useCrashReporter.js";
import {useRoleSubscription} from "./hooks/useRoleSubscription.js";
import {useChannelSubscription} from "./hooks/useChannelSubscription.js";
import {useCallEventsSync} from "./hooks/useConversationCall.js";
import KickedFromServerDialog from "./features/servers/dialogs/KickedFromServerDialog.jsx";
import BannedFromServerDialog from "./features/servers/dialogs/BannedFromServerDialog.jsx";
import IncomingCallModal from "./features/private/friends/IncomingCallModal.jsx";
import PageNotFound from "./errors/PageNotFound.jsx";
import PageNotFoundSidebar from "./errors/PageNotFoundSidebar.jsx";
import {SettingsProvider, useSettings} from "./context/SettingsContext.jsx";
import {ContextMenuProvider} from "./context/ContextMenuProvider.jsx";
import ScreenPickerModal from "./features/components/ScreenPickerModal.jsx";
import UpdateBanner from "./features/components/UpdateBanner.jsx";
import Spinner from "./features/components/static/Spinner.jsx";

const Channel = lazy(() => import("./features/servers/channels/Channel.jsx"));
const VoiceChannelView = lazy(() => import("./features/servers/channels/VoiceChannelView.jsx"));
const Conversation = lazy(() => import("./features/private/friends/Conversation.jsx"));
const MemberList = lazy(() => import("./features/servers/members/MemberList.jsx"));
const SettingsModal = lazy(() => import("./features/settings/SettingsModal.jsx"));
const InviteJoin = lazy(() => import("./features/servers/InviteJoin.jsx"));

function RouteFallback() {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Spinner size="w-8 h-8" />
        </div>
    );
}

function LazySettingsModal() {
    const { open } = useSettings();
    if (!open) return null;
    return (
        <Suspense fallback={null}>
            <SettingsModal />
        </Suspense>
    );
}

function RouterEvents() {
    const { kicked, dismissKicked, banned, dismissBanned } = useUserServerUpdate();
    // Ban takes precedence (more severe) if both somehow fire together.
    if (banned) {
        return <BannedFromServerDialog
            serverName={banned.serverName}
            reason={banned.reason}
            onClose={dismissBanned}
        />;
    }
    if (kicked) {
        return <KickedFromServerDialog serverName={kicked.serverName} onClose={dismissKicked} />;
    }
    return null;
}

function ProtectedShell({ children }) {
    return (
        <ProtectedRoute>
            <RouterEvents />
            <IncomingCallModal />
            {children}
        </ProtectedRoute>
    );
}

function App() {
    useCrashReporter();
    usePresence();
    useRoleSubscription();
    useChannelSubscription();
    useCallEventsSync();
    useActivitySubscription();
    useGameActivityReporter();
    useVoiceEvents();
    useDeleteMessage();
    useEditMessage();
    useReactMessage();
    useMessages();
    useFriendRequests();
    useReadStates();
    usePinSubscription();
    usePollSubscription();
    useConversationEvents();
    useNotifications();
    useBadgeCount();

    return (
        <ContextMenuProvider>
        <SettingsProvider>
        <HashRouter>
            <Routes>
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                <Route path="/*" element={
                    <ProtectedShell>
                        <GlobalVoiceComponent />
                        <div className="h-screen flex antialiased overflow-hidden bg-guild-bar">
                            <div className="flex flex-col h-screen shrink-0 border-r border-border">
                                <div className="flex h-full">
                                    <ServerSelector />
                                    <div className="max-w-xs min-w-xs w-full h-full">
                                        <Routes>
                                            <Route path="/@me/*" element={<MessagesSidebar />} />
                                            <Route path="/servers/:serverId/*" element={<ServerSidebar />} />
                                            <Route path="/error/404" element={<PageNotFoundSidebar />} />
                                        </Routes>
                                    </div>
                                </div>
                                <UserPanel />
                            </div>
                            <Suspense fallback={<RouteFallback />}>
                                <Routes>
                                    <Route path="/" element={<Navigate to="/@me/friends" replace />} />
                                    <Route path="/@me" element={<SidebarLayout />} >
                                        <Route index element={<LastPathRedirect pathKey="messages" defaultPath="/@me/friends" />} />
                                        <Route path="friends" element={<FriendsLayout />} >
                                            <Route index element={<LastPathRedirect pathKey="friends" defaultPath="/@me/friends/online" />} />
                                            <Route path="online" element={<FriendsList filter="online" />} />
                                            <Route path="all" element={<FriendsList filter="all" />} />
                                            <Route path="pending" element={<FriendsListPending filter="pending" />} />
                                            <Route path="add" element={<AddFriend />} />
                                        </Route>
                                        <Route path="messages/:conversationId" element={<Conversation />} />
                                        <Route path="quests" element={<div>Quests</div>} />
                                    </Route>
                                    <Route path="/servers/:serverId" element={<SidebarLayout />}>
                                        <Route index element={<ServerRedirect />} />
                                        <Route path="members" element={<MemberList />} />
                                        <Route path="channels/:channelId" element={<Channel />} />
                                        <Route path="voice/:channelId" element={<VoiceChannelView />} />
                                        <Route path="settings" element={<div>Settings</div>} />
                                    </Route>
                                    <Route path="/invite/:code" element={<InviteJoin />} />
                                    <Route path="/error/404" element={<PageNotFound />} />
                                </Routes>
                            </Suspense>
                        </div>
                    </ProtectedShell>
                } />
            </Routes>
            <LazySettingsModal />
        </HashRouter>
        </SettingsProvider>
        <ScreenPickerModal />
        <UpdateBanner />
        </ContextMenuProvider>
    );
}

export default App;