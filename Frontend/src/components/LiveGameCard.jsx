import { Link } from 'react-router-dom';
import { getTeamLogo } from '../constants/teams.js';

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
            <div style = {{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span style={{display: 'flex', alignItems:'center', gap: 6}}>
                    <img
                        src={getTeamLogo(game.home_team_abbreviation)}
                        alt=""
                        width={20}
                        height={20}
                        onError={(e) => {e.target.style.display = 'none';}}
                    />
                    {game.home_team_name || 'Home'}
                </span>
                <strong>{game.home_score ?? 0} - {game.away_score || 0}</strong>
                <span style={{display:'flex', alignItems:'center', gap: 6}}>
                    {game.away_team_name || 'Away'}
                    <img 
                        src={getTeamLogo(game.away_team_abbreviation)}
                        alt=""
                        width={20}
                        height={20}
                        onError={(e) => {e.target,style.display = 'none';}}
                    />
                </span>
            </div>
        </Link>
    );
}