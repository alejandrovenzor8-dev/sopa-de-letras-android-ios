import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import WordGrid from '../components/WordGrid';
import WordList from '../components/WordList';
import { FoundWord, RootStackParamList } from '../types';
import {
  DIFFICULTY_CONFIG,
  DIFFICULTY_LABELS,
  generateGrid,
  pickWords,
} from '../utils/wordGenerator';

type SoloNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Solo'>;
type SoloRouteProp = RouteProp<RootStackParamList, 'Solo'>;

interface Props {
  navigation: SoloNavigationProp;
  route: SoloRouteProp;
}

const SOLO_COLOR = '#FF8F00';

export default function SoloGameScreen({ navigation, route }: Props) {
  const { playerName, difficulty } = route.params;

  const [round, setRound] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<Record<string, FoundWord>>({});
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const nextWords = pickWords(config.wordsCount);
    const nextGrid = generateGrid(nextWords, config.size);
    setWords(nextWords);
    setGrid(nextGrid);
    setFoundWords({});
    setShowWin(false);
  }, [round, difficulty]);

  const foundCount = Object.keys(foundWords).length;
  const totalWords = words.length;
  const score = foundCount;

  useEffect(() => {
    if (totalWords > 0 && foundCount >= totalWords) {
      setShowWin(true);
    }
  }, [foundCount, totalWords]);

  const handleWordFound = (
    cells: Array<{ row: number; col: number }>,
    word: string,
  ) => {
    const upperWord = word.toUpperCase();
    if (!words.includes(upperWord)) return;
    if (foundWords[upperWord]) return;

    setFoundWords((prev) => ({
      ...prev,
      [upperWord]: {
        word: upperWord,
        foundBy: 'solo-player',
        foundByName: playerName || 'Jugador',
        cells,
        color: SOLO_COLOR,
      },
    }));
  };

  const subtitle = useMemo(() => {
    return playerName?.trim() ? `Jugador: ${playerName}` : 'Jugador: Tú';
  }, [playerName]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧩 Modo Solitario</Text>
        <Text style={styles.progress}>
          {foundCount}/{totalWords || DIFFICULTY_CONFIG[difficulty].wordsCount} palabras
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.exitButton}>
          <Text style={styles.exitButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.difficultyPill}>
          Dificultad: {DIFFICULTY_LABELS[difficulty]}
        </Text>

        {grid.length > 0 && (
          <WordGrid
            grid={grid}
            foundWords={foundWords}
            onWordFound={handleWordFound}
            playerColor={SOLO_COLOR}
          />
        )}

        <View style={styles.bottomSection}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Puntaje</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>

          <Text style={styles.sectionTitle}>Palabras</Text>
          <WordList words={words} foundWords={foundWords} />
        </View>
      </ScrollView>

      <Modal visible={showWin} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.winEmoji}>🎉</Text>
            <Text style={styles.winTitle}>¡Completaste la sopa!</Text>
            <Text style={styles.winnerText}>Puntaje final: {score}</Text>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={() => setRound((r) => r + 1)}
            >
              <Text style={styles.playAgainText}>🔄 Nueva Partida</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.homeButtonText}>🏠 Volver al Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FF' },
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
    color: '#FFE082',
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
  subtitle: {
    color: '#3949AB',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  difficultyPill: {
    alignSelf: 'center',
    backgroundColor: '#E8EAF6',
    color: '#3949AB',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
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
  scoreCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD54F',
    padding: 12,
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#8D6E00',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  scoreValue: {
    color: '#E65100',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 2,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 6,
    textAlign: 'center',
  },
  winnerText: {
    fontSize: 16,
    color: '#3949AB',
    marginBottom: 16,
    textAlign: 'center',
  },
  playAgainButton: {
    backgroundColor: '#3D5AFE',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  playAgainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    borderWidth: 1.5,
    borderColor: '#3D5AFE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  homeButtonText: {
    color: '#3D5AFE',
    fontSize: 15,
    fontWeight: '700',
  },
});
