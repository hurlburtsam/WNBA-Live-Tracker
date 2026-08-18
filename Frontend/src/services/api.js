const API_BASE = 'http://localhost:4000';

export async function fetchLiveGames() {
    const response = await fetch(`${API_BASE}/api/games/live`);
    return response.json();
}

export async function fetchGameById(game_id) {
    const response = await fetch(`${API_BASE}/api/games/${game_id}`);
    return response.json();
}

export async function fetchGameLeaders(game_id) {
    const response = await fetch(`${API_BASE}/api/games/${game_id}/leaders`);
    return response.json();
}