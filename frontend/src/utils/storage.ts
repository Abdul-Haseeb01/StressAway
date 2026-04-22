// Auth Storage Helpers
export const getStoredToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const clearStorage = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
};

export const updateStoredUser = (updatedUser: any) => {
    if (typeof window === 'undefined') return;
    // Check where the token is to decide where to update the user
    if (localStorage.getItem('token')) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
};
