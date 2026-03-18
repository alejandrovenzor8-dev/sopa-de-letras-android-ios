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
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase';
import { generateRoomCode } from '../utils/roomCode';
import { Difficulty, GameRoom, RootStackParamList } from '../types';
import { DIFFICULTY_LABELS } from '../utils/wordGenerator';

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
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'solo' | null>(null);

  const playerId = useRef(
    'player_' + Math.random().toString(36).substring(2, 10),
  ).current;

  const getPlayerColor = (index: number) =>
    PLAYER_COLORS[index % PLAYER_COLORS.length];

  const handleCreateRoom = async (difficulty: Difficulty) => {
    if (!db) {
      Alert.alert('Firebase no configurado', 'Configura las credenciales en src/firebase.ts o variables EXPO_PUBLIC_FIREBASE_*');
      return;
    }
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
        difficulty,
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
    if (!db) {
      Alert.alert('Firebase no configurado', 'Configura las credenciales en src/firebase.ts o variables EXPO_PUBLIC_FIREBASE_*');
      return;
    }
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

  const handleSoloMode = (difficulty: Difficulty) => {
    navigation.navigate('Solo', {
      playerName: playerName.trim() || 'Jugador',
      difficulty,
    });
  };

  const openDifficultySelector = (action: 'create' | 'solo') => {
    setPendingAction(action);
    setShowDifficultyModal(true);
  };

  const handleDifficultySelected = async (difficulty: Difficulty) => {
    setShowDifficultyModal(false);
    const action = pendingAction;
    setPendingAction(null);

    if (action === 'create') {
      await handleCreateRoom(difficulty);
      return;
    }

    if (action === 'solo') {
      handleSoloMode(difficulty);
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
                onPress={() => openDifficultySelector('create')}
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

              <TouchableOpacity
                style={styles.soloButton}
                onPress={() => openDifficultySelector('solo')}
                disabled={loading}
              >
                <Text style={styles.soloButtonText}>🧩 Modo Solitario</Text>
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

      <Modal visible={showDifficultyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona dificultad</Text>
            <Text style={styles.modalSubtitle}>
              Elige el nivel para tu partida
            </Text>

            {(['facil', 'medio', 'dificil', 'experto'] as Difficulty[]).map((difficulty) => (
              <TouchableOpacity
                key={difficulty}
                style={styles.difficultyButton}
                onPress={() => handleDifficultySelected(difficulty)}
                disabled={loading}
              >
                <Text style={styles.difficultyButtonText}>{DIFFICULTY_LABELS[difficulty]}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowDifficultyModal(false);
                setPendingAction(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#3949AB',
    fontSize: 16,
    fontWeight: '600',
  },
  soloButton: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FBC02D',
    padding: 14,
    alignItems: 'center',
  },
  soloButtonText: {
    color: '#8D6E00',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    color: '#9FA8DA',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A237E',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#7986CB',
    textAlign: 'center',
    marginBottom: 12,
  },
  difficultyButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyButtonText: {
    color: '#1A237E',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#C5CAE9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#5C6BC0',
    fontSize: 14,
    fontWeight: '600',
  },
});
