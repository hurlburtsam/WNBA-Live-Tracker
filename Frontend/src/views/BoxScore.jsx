import { useCallback, useEffect, useState, useMemo } from 'react';
import {Link, useParams} from 'react-router-dom';
import { fetchGameDetails } from '../services/api';
import { useGameSocket } from '../hooks/useGameSocket';

const STAT_COLUMNS = [
    {key: 'minutes_played', label: 'MIN'},
    {key: 'points', label: 'PTS'},
    {key: 'rebounds_total', label: 'REB'},
    {key: 'assists', label: 'AST'},
    {key: 'steals', label: 'STL'},
    {key:'blocks', label: 'BLK'},
    {key: 'turnovers', label: 'TOV'},
    {key:'field_goals_made', label: 'FGM', paired: 'field_goals_attempted', format: 'madeAttempted'},
    {key: 'three_pointers_made', label: '3PM', paired: 'three_pointers_attempted', format: 'madeAttempted'},
    {key: 'free_throws_made', label: 'FTM', paired: 'free_throws_attempted', format: 'madeAttempted'},
];

const LEADER_LABELS = {
    points: 'Points',
    rebounds: 'Rebounds',
    assists: 'Assists',
};

function formatStatValue(player, column) {
    if(column.format === 'madeAttempted') {
        const made = player[column.key] ?? 0;
        const attempted = player[column.paired] ?? 0;
        return `${made}-${attempted}`;
    }

    return player[column.key] ?? 0;
}

function StatLeaders({ teamName, leaders }) {
    if(!leaders.length) {
        return (
            <div style = {styles.leadersCard}>
                <h4 style = {styles.leadersTeam}>{teamName}</h4>
                <p style = {styles.muted} > No leader data yet </p>
            </div>
        );
    }
    return (
        <div style = {styles.leadersCard}>
            <h4 style = {styles.leadersTeam}>{teamName}</h4>
            <div style = {styles.leadersGrid}>
                {leaders.map((leader) => (
                    <div key={`${leader.stat_name}-${leader.player_id}`} style={styles.leaderItem}>
                        <span style={styles.leaderStat}>{LEADER_LABELS[leader.stat_name] || leader.stat_name}</span>
                        <strong>{leader.full_name}</strong>
                        <span style = {styles.leaderValue}>{leader.stat_value}</span>
                </div>
                ))}        
            </div>
        </div>
    );
}

function TeamBoxScoreTable({ teamName, players }) {
    return (
        <div style = {styles.tableSection}>
            <h3 style = {styles.tableTitle}>{teamName}</h3>
            <div style = {styles.tableWrap}>
                <table style = {styles.table}>
                    <thead>
                        <tr>
                            <th style = {styles.playerCol}>Player</th>
                            {STAT_COLUMNS.map((column) => (
                                <th key={column.label} style={styles.statCol}>{column.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {players.length === 0 ? (
                            <tr>
                                <td colSpan={STAT_COLUMNS.length + 1} style = {styles.emptyRow}>
                                    No player stats yet
                                </td>
                            </tr>
                        ) : (
                            players.map((player) => (
                                <tr key={player.player_id} style={player.starter ? styles.starterRow: undefined}>
                                    <td style = {styles.playerCell}>
                                        {player.starter ? '*' : ''}{player.player_name || `Player ${player.player_id}`}
                                    </td>
                                    {STAT_COLUMNS.map((column) => (
                                        <td key={column.label} style = {styles.statCol}>
                                            {formatStatValue(player, column)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function BoxScore() {
    const { gameId} = useParams();
    const [game, setGame ] = useState(null);
    const [loading, setLoading ] = useState(true);
    const [error, setError] = useState(null);
    const liveUpdate = useGameSocket(gameId);

    const loadGameDetails = useCallback(async () => {
        const result = await fetchGameDetails(gameId);

        if(result.success) {
            setGame(result.data);
            setError(null);
        } else {
            setError(result.error || 'Failed to load game');
        }

        setLoading(false);
    }, [gameId]);

    useEffect(() => {
        setLoading(true);
        loadGameDetails();
    }, [loadGameDetails]);

    useEffect(() => {
        if(!liveUpdate) return;

        setGame((prev) => {
            if(!prev) return prev;

            return {
                ...prev,
                status: liveUpdate.status ?? prev.status,
                home_score: liveUpdate.homeScore ?? liveUpdate.home_score ?? prev.home_score,
                away_score: liveUpdate.awayScore ?? liveUpdate.away_score ?? prev.away_score,
                period: liveUpdate.period ?? prev.period,
                clock: liveUpdate.clock ?? prev.clock,
            };
        });

        loadGameDetails();
    }, [liveUpdate, loadGameDetails]);

    const { homePlayers, awayPlayers } = useMemo(() => {
        const boxScore = game?.boxScore || [];

        return {
            homePlayers: boxScore.filter((row) => row.team_id === game?.home_team_id),
            awayPlayers: boxScore.filter((row) => row.team_id === game?.away_team_id),
        };
    }, [game]);

    if(loading) {
        return <div style = {styles.page}>Loading box score...</div>;
    }

    if(error || !game) {
        return (
            <div style = {styles.page}>
                <p>{error || 'Game not found'}</p>
                <Link to="/">Back to live games</Link>
            </div>
        );
    }

    return (
        <div style = {styles.page}>
            <Link to="/" style={styles.backLink}> Back to live games</Link>

            <div style = {styles.header}>
                <div style = {styles.teamBlock}>
                    <span style={styles.teamName}>{game.home_team_name || 'Home'}</span>
                    <strong style = {styles.score}>{game.home_score ?? 0}</strong>
                </div>
                <div style = {styles.gameMeta}>
                    <span style={styles.status}>{game.status}</span>
                    <span style={styles.clock}>{game.clock || '--'}</span>
                    {game.period ? <span>0{game.period}</span> : null}
                </div>
                <div style={styles.teamBlock}>
                    <strong style={styles.score}>{game.away_score ?? 0} </strong>
                    <span style={styles.teamName}>{game.away_team_name || 'Away'}</span>
                </div>
            </div>

            <section style = {styles.section}>
                <h2> Stat Leaders </h2>
                <div style = {styles.leadersRow}>
                    <StatLeaders
                        teamName={game.home_team_name || 'Home'}
                        leaders={game.statLeaders?.homeTeamLeaders}
                    />
                    <StatLeaders
                        teamName={game.away_team_name || 'Away'}
                        leaders={game.statLeaders?.awayTeamLeaders}
                    />
                </div>
            </section>

            <section style = {styles.section}>
                <h2>Box Score</h2>
                <TeamBoxScoreTable teamName={game.home_team_name || 'Home'} players={homePlayers}/>
                <TeamBoxScoreTable teamName = {game.away_team_name || 'Away'} players={awayPlayers}/>
            </section>
        </div>
    );
}

const styles = {
    page: {
        maxWidth: 1100,
        margin: '0 auto',
        padding: 20,
        textAlign: 'left',
    },
    backLink: {
        display: 'inline-block',
        marginBottom: 16,
        color: 'inherit',
        textDecoration: 'none',
    },
    header: {
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 16,
        border: '1px solid #ddd',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
    },
    teamBlock: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    teamName: {
        fontSize: 18,
        fontWeight: 600,
    },
    score: {
        fontSize: 32,
    },
    gameMeta: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        color: '#666',
        textTransform: 'capitalize'
    },
    status: {
        fontWeight: 600,
    },
    clock: {
        fontFamily: 'monospace',
    },
    section: {
        marginBottom: 32,
    },
    leadersRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
    },
    leadersCard: {
        border: '1px solid #ddd',
        borderRadius: 12,
        padding: 16,
    },
    leadersTeam: {
        margin: '0 0 12px',
    },
    leadersGrid: {
        display: 'grid',
        gap: 12,
    },
    leaderItem: {
        display: 'grid',
        gridTemplateColumns: '90px 1fr auto',
        gap: 8,
        alignItems: 'center',
    },
    leaderStat: {
        color: '#666',
        fontSize: 14,
    },
    leaderValue: {
        fontWeight: 700,
        fontFamily: 'monospace',
    },
    muted: {
        color: '#666',
        margin: 0,
    },
    tableSection: {
        marginBottom: 24,
    },
    tableTitle: {
        margin: '0 0 8px',
    },
    tableWrap: {
        overflowX: 'auto',
        border: '1px solid #ddd',
        borderRadius: 12,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 14,
    },
    playerCol: {
        textAlign: 'left',
        padding: '10px 12px',
        borderBottom: '1px solid #eee',
        minWidth: 160,
    },
    statCol: {
        textAlign: 'center',
        padding: '10px 8px',
        borderBottom: '1px solid #eee',
        whiteSpace: 'nowrap',
    },
    playerCell: {
        padding: '10px 12px',
        borderBottom: '1px solid #eee',
        fontWeight: 500,
    },
    starterRow: {
        background: 'rgba(170, 59, 255, 0.06)',
    },
    emptyRow: {
        padding: 16,
        textAlign: 'center',
        color: '#666',
    }
};