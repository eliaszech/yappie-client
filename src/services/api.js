const API_URL = import.meta.env.API_URL || 'http://localhost:3000';


export const fetchUsers = () =>
    fetch(`${API_URL}/users`).then(res => {
        return res.json();
    });

export const fetchConversations = () =>
    fetch(`${API_URL}/conversations?userId=3eb5ef0d-b02c-4def-890e-4596b12deeaa`).then(res => {
        return res.json();
    });