import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player } from '../types';

interface PlayerListProps {
  players: Record<string, Player>;
  currentPlayerId: string;
}

export default function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  const sorted = Object.values(players).sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      {sorted.map((player) => (
        <View
          key={player.id}
          style={[
            styles.playerRow,
            player.id === currentPlayerId && styles.currentPlayer,
          ]}
        >
          <View style={[styles.colorDot, { backgroundColor: player.color }]} />
          <Text style={styles.playerName}>
            {player.name}
            {player.id === currentPlayerId ? ' (tú)' : ''}
          </Text>
          <Text style={styles.score}>{player.score} pts</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#F0F4FF',
  },
  currentPlayer: {
    backgroundColor: '#D6E4FF',
    borderWidth: 1,
    borderColor: '#3D5AFE',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    color: '#1A237E',
    fontWeight: '500',
  },
  score: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3D5AFE',
  },
});
