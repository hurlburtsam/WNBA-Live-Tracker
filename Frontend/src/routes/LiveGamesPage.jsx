import { useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { fetchLiveGames } from '../services/api';
import LiveGameCard from '../components/LiveGameCard';

export default function LiveGamesPage() {

    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        async function loadGames() {
            const result = await fetchLiveGames();
            if(result.success) {
                setGames(result.data.games || result.data || []);
            }
            setLoading(false);
        }

        loadGames();

        socket.on('games:live', (payload) => {
            if(payload?.data) {
                setGames(payload.data.games || payload.data || []);
            }
        });

        return () => {
            socket.off('games:live');
        };
    }, []);

    if(loading) return <div>Loading live games...</div>;

    

    return (
        <div style = {{ maxWidth:900, margin: '0 auto', textAlign: 'center', padding: 20, minHeight: '100vh', backgroundColor: '#fff5eb'}}>
            <h2>Live Games</h2>
            {games.length === 0 ? <p>No live games right now</p>: games.map(game => (
                <LiveGameCard key={game.id} game={game}/>
            ))}
        </div>
    );
}