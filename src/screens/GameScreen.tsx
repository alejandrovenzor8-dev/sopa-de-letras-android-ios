import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ref, onValue, update, remove } from 'firebase/database';
import { db } from '../firebase';
import { GameRoom, FoundWord, RootStackParamList } from '../types';
import WordGrid from '../components/WordGrid';
import WordList from '../components/WordList';
import PlayerList from '../components/PlayerList';

type GameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;
type GameRouteProp = RouteProp<RootStackParamList, 'Game'>;

interface Props {
  navigation: GameNavigationProp;
  route: GameRouteProp;
}

export default function GameScreen({ navigation, route }: Props) {
  const { roomCode, playerId, playerName, playerColor } = route.params;
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        Alert.alert('Sala cerrada', 'La sala ya no existe');
        navigation.navigate('Home');
        return;
      }
      const data = snapshot.val() as GameRoom;
      setRoom(data);

      if (data.status === 'finished') {
        setShowWin(true);
      } else if (data.status === 'playing' && data.words) {
        // Reactively mark game as finished when all words are found
        const foundCount = Object.keys(data.foundWords ?? {}).length;
        if (foundCount >= data.words.length) {
          update(ref(db, `rooms/${roomCode}`), { status: 'finished' });
        }
      }
    });
    return () => unsub();
  }, [roomCode, navigation]);

  const handleWordFound = useCallback(
    async (cells: Array<{ row: number; col: number }>, word: string) => {
      if (!room?.words) return;

      const upperWord = word.toUpperCase();
      const isTarget = room.words.includes(upperWord);
      if (!isTarget) return;

      const alreadyFound = room.foundWords && room.foundWords[upperWord];
      if (alreadyFound) return;

      const foundWord: FoundWord = {
        word: upperWord,
        foundBy: playerId,
        foundByName: playerName,
        cells,
        color: playerColor,
      };

      const currentScore = room.players?.[playerId]?.score ?? 0;
      await update(ref(db, `rooms/${roomCode}`), {
        [`foundWords/${upperWord}`]: foundWord,
        [`players/${playerId}/score`]: currentScore + 1,
      });
    },
    [room, playerId, playerName, playerColor, roomCode],
  );

  const handleExit = () => {
    Alert.alert('Salir', '¿Seguro que quieres abandonar la partida?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(ref(db, `rooms/${roomCode}/players/${playerId}`));
          } catch {
            // ignore
          }
          navigation.navigate('Home');
        },
      },
    ]);
  };

  const handlePlayAgain = async () => {
    setShowWin(false);
    try {
      await remove(ref(db, `rooms/${roomCode}`));
    } catch {
      // ignore
    }
    navigation.navigate('Home');
  };

  if (!room || !room.grid || !room.words) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3D5AFE" />
      </View>
    );
  }

  const foundWords = room.foundWords ?? {};
  const players = room.players ?? {};
  const foundCount = Object.keys(foundWords).length;
  const totalWords = room.words.length;

  // Find winner (highest score)
  const winnerEntry = Object.values(players).sort((a, b) => b.score - a.score)[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔤 Sopa de Letras</Text>
        <Text style={styles.progress}>
          {foundCount}/{totalWords} palabras
        </Text>
        <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
          <Text style={styles.exitButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <WordGrid
          grid={room.grid}
          foundWords={foundWords}
          onWordFound={handleWordFound}
          playerColor={playerColor}
        />

        <View style={styles.bottomSection}>
          <Text style={styles.sectionTitle}>Palabras</Text>
          <WordList words={room.words} foundWords={foundWords} />

          <Text style={styles.sectionTitle}>Jugadores</Text>
          <PlayerList players={players} currentPlayerId={playerId} />
        </View>
      </ScrollView>

      <Modal visible={showWin} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.winEmoji}>🏆</Text>
            <Text style={styles.winTitle}>¡Juego Terminado!</Text>
            {winnerEntry && (
              <Text style={styles.winnerText}>
                Ganador: {winnerEntry.name} con {winnerEntry.score} puntos
              </Text>
            )}
            <View style={styles.finalScores}>
              {Object.values(players)
                .sort((a, b) => b.score - a.score)
                .map((p) => (
                  <View key={p.id} style={styles.scoreRow}>
                    <View style={[styles.colorDot, { backgroundColor: p.color }]} />
                    <Text style={styles.scorePlayerName}>{p.name}</Text>
                    <Text style={styles.scoreValue}>{p.score} pts</Text>
                  </View>
                ))}
            </View>
            <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
              <Text style={styles.playAgainText}>🎮 Jugar de Nuevo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: '#1A237E',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  progress: {
    color: '#9FA8DA',
    fontSize: 14,
    marginRight: 8,
  },
  exitButton: {
    padding: 4,
  },
  exitButtonText: {
    color: '#EF9A9A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  bottomSection: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A237E',
    marginTop: 12,
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    elevation: 10,
  },
  winEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  winTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 6,
  },
  winnerText: {
    fontSize: 16,
    color: '#3949AB',
    marginBottom: 16,
    textAlign: 'center',
  },
  finalScores: {
    width: '100%',
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAF6',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  scorePlayerName: {
    flex: 1,
    fontSize: 15,
    color: '#1A237E',
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3D5AFE',
  },
  playAgainButton: {
    backgroundColor: '#3D5AFE',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  playAgainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
