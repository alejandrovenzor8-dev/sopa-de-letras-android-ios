import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Share,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ref, onValue, update, remove } from 'firebase/database';
import { db } from '../firebase';
import { GameRoom, RootStackParamList } from '../types';
import { generateGrid, pickWords, GRID_SIZE } from '../utils/wordGenerator';
import PlayerList from '../components/PlayerList';

type LobbyNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Lobby'>;
type LobbyRouteProp = RouteProp<RootStackParamList, 'Lobby'>;

interface Props {
  navigation: LobbyNavigationProp;
  route: LobbyRouteProp;
}

export default function LobbyScreen({ navigation, route }: Props) {
  const { roomCode, playerId, playerName, isHost } = route.params;
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [starting, setStarting] = useState(false);

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

      if (data.status === 'playing') {
        const player = data.players?.[playerId];
        navigation.replace('Game', {
          roomCode,
          playerId,
          playerName,
          playerColor: player?.color ?? '#3D5AFE',
        });
      }
    });
    return () => unsub();
  }, [roomCode, playerId, playerName, navigation]);

  const handleStartGame = async () => {
    if (!room) return;
    setStarting(true);
    try {
      const words = pickWords(8);
      const grid = generateGrid(words, GRID_SIZE);
      await update(ref(db, `rooms/${roomCode}`), {
        status: 'playing',
        words,
        grid,
        foundWords: {},
      });
    } catch {
      Alert.alert('Error', 'No se pudo iniciar la partida');
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    Alert.alert('Salir', '¿Seguro que quieres salir de la sala?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isHost) {
              await remove(ref(db, `rooms/${roomCode}`));
            } else {
              await remove(ref(db, `rooms/${roomCode}/players/${playerId}`));
            }
          } catch {
            // ignore
          }
          navigation.navigate('Home');
        },
      },
    ]);
  };

  const handleShare = () => {
    Share.share({ message: `¡Únete a mi partida de Sopa de Letras! Código: ${roomCode}` });
  };

  if (!room) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3D5AFE" />
      </View>
    );
  }

  const players = room.players ?? {};
  const playerCount = Object.keys(players).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sala de espera</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Código de sala</Text>
          <Text style={styles.code}>{roomCode}</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>📤 Compartir</Text>
          </TouchableOpacity>
          <Text style={styles.codeHint}>Comparte este código con tus amigos</Text>
        </View>

        <View style={styles.playersCard}>
          <Text style={styles.sectionTitle}>
            Jugadores ({playerCount}/5)
          </Text>
          <PlayerList players={players} currentPlayerId={playerId} />
        </View>

        {isHost ? (
          <TouchableOpacity
            style={[styles.startButton, playerCount < 1 && styles.disabledButton]}
            onPress={handleStartGame}
            disabled={starting || playerCount < 1}
          >
            {starting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>🚀 Iniciar Juego</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingContainer}>
            <ActivityIndicator color="#3D5AFE" />
            <Text style={styles.waitingText}>
              Esperando que el anfitrión inicie el juego...
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
          <Text style={styles.leaveButtonText}>Salir de la sala</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: '#1A237E',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  codeLabel: {
    fontSize: 14,
    color: '#7986CB',
    marginBottom: 8,
  },
  code: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1A237E',
    letterSpacing: 8,
    marginBottom: 12,
  },
  shareButton: {
    backgroundColor: '#E8EAF6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  shareButtonText: {
    color: '#3949AB',
    fontWeight: '600',
  },
  codeHint: {
    fontSize: 12,
    color: '#9FA8DA',
  },
  playersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#00C853',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingContainer: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  waitingText: {
    color: '#7986CB',
    marginTop: 8,
    textAlign: 'center',
  },
  leaveButton: {
    borderWidth: 1.5,
    borderColor: '#EF5350',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#EF5350',
    fontSize: 15,
    fontWeight: '600',
  },
});
