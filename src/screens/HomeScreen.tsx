import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase';
import { generateRoomCode } from '../utils/roomCode';
import { GameRoom, RootStackParamList } from '../types';

const PLAYER_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#F39C12'];

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'home' | 'join'>('home');
  const [loading, setLoading] = useState(false);

  const playerId = useRef(
    'player_' + Math.random().toString(36).substring(2, 10),
  ).current;

  const getPlayerColor = (index: number) =>
    PLAYER_COLORS[index % PLAYER_COLORS.length];

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }
    setLoading(true);
    try {
      const code = generateRoomCode();
      const room: GameRoom = {
        code,
        hostId: playerId,
        status: 'waiting',
        players: {
          [playerId]: {
            id: playerId,
            name: playerName.trim(),
            score: 0,
            color: getPlayerColor(0),
          },
        },
        createdAt: Date.now(),
      };
      await set(ref(db, `rooms/${code}`), room);
      navigation.navigate('Lobby', {
        roomCode: code,
        playerId,
        playerName: playerName.trim(),
        isHost: true,
      });
    } catch (e) {
      Alert.alert('Error', 'No se pudo crear la sala. Verifica tu conexión y la configuración de Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de la sala');
      return;
    }
    setLoading(true);
    try {
      const code = roomCode.trim().toUpperCase();
      const snapshot = await get(ref(db, `rooms/${code}`));
      if (!snapshot.exists()) {
        Alert.alert('Error', 'Sala no encontrada');
        return;
      }
      const room = snapshot.val() as GameRoom;
      if (room.status !== 'waiting') {
        Alert.alert('Error', 'La partida ya comenzó');
        return;
      }
      const playerCount = Object.keys(room.players ?? {}).length;
      if (playerCount >= 5) {
        Alert.alert('Error', 'La sala está llena');
        return;
      }
      const color = getPlayerColor(playerCount);
      await set(ref(db, `rooms/${code}/players/${playerId}`), {
        id: playerId,
        name: playerName.trim(),
        score: 0,
        color,
      });
      navigation.navigate('Lobby', {
        roomCode: code,
        playerId,
        playerName: playerName.trim(),
        isHost: false,
      });
    } catch (e) {
      Alert.alert('Error', 'No se pudo unir a la sala. Verifica tu conexión y la configuración de Firebase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>🔤 Sopa de Letras</Text>
          <Text style={styles.subtitle}>Juego cooperativo multijugador</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Tu nombre</Text>
          <TextInput
            style={styles.input}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Ingresa tu nombre"
            placeholderTextColor="#9FA8DA"
            maxLength={20}
            autoCapitalize="words"
          />

          {mode === 'home' ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCreateRoom}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>🎮 Crear Sala</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setMode('join')}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>🔗 Unirse a Sala</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Código de sala</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={roomCode}
                onChangeText={(t) => setRoomCode(t.toUpperCase())}
                placeholder="XXXXXX"
                placeholderTextColor="#9FA8DA"
                maxLength={6}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleJoinRoom}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>✅ Unirse</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setMode('home')}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>← Volver</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.hint}>
          Encuentra todas las palabras antes que los demás jugadores
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#1A237E' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#1A237E',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9FA8DA',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3949AB',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#C5CAE9',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1A237E',
    marginBottom: 16,
    backgroundColor: '#F8F9FF',
  },
  codeInput: {
    letterSpacing: 6,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#3D5AFE',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#E8EAF6',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#3949AB',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: '#9FA8DA',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
    paddingHorizontal: 16,
  },
});
