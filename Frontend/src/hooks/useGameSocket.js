import { useEffect, useState } from 'react';
import { socket } from '../services/socket';

export function useGameSocket(game_id) {
    const [game, setGame] = useState(null);

    useEffect(() => {
        if(!game_id) return;

        socket.emit('joinGame', Number(game_id));

        const handleGameUpdate = (payload) => {
            if(payload.gameId === Number(game_id)) {
                setGame((prev) => ({
                    ...prev,
                    ...payload.data,
                }));
            }
        };

        socket.on('game:update', handleGameUpdate);

        return () => {
            socket.emit('leaveGame', Number(game_id));
            socket.off('game:update', handleGameUpdate);
        };
    }, [game_id]);

    return game;
}
