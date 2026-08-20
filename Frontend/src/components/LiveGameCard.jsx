import { Link } from 'react-router-dom';

export default function LiveGameCard({ game }) {
    return (
        < Link 
            to = {`/games/${game.id}`}
            style = {{
                display: 'block',
                border: '1 px solid #ddd',
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
            }}
        >
            <div style = {{ display: 'flex', justifyContent: 'space-between'}}>
                <span>{game.home_team_name || 'Home'}</span>
                <strong>{game.home_score ?? 0} - {game.away_score || 0}</strong>
                <span>{game.away_team_name || 'Away'}</span>
            </div>
            <div style = {{ display: 'flex', justifyContent: 'space-between', color: '#666'}}>
                <span>{game.status}</span>
                <span>{game.clock || '--'}</span>
            </div>
        </Link>
    );
}