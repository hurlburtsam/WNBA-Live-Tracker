const API_BASE = 'http://localhost:4000';
 
async function safeFetch(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return { success: false, data: null };
        return await response.json();
    } catch (err) {
        return { success: false, data: null };
    }
}
 
export const fetchLiveGames = () => safeFetch(`${API_BASE}/api/games/live`);
export const fetchGameById = (game_id) => safeFetch(`${API_BASE}/api/games/${game_id}`);
export const fetchGameLeaders = (game_id) => safeFetch(`${API_BASE}/api/games/${game_id}/leaders`);
export const fetchGameDetails = (game_id) => safeFetch(`${API_BASE}/api/games/${game_id}/details`);