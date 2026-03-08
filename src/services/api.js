const API_URL = import.meta.env.API_URL || 'http://localhost:3000';


export const fetchUsers = () =>
    fetch(`${API_URL}/users`).then(res => {
        return res.json();
    });

export const fetchConversations = () =>
    fetch(`${API_URL}/conversations?userId=8ad5c742-f4c6-4519-899d-1e2b1c15a8bd`).then(res => {
        return res.json();
    });

export const fetchConversation = (conversationId) =>
    fetch(`${API_URL}/conversations/${conversationId}`).then(res => {
        return res.json();
    });