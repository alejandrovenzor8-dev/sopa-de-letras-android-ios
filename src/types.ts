export interface Player {
  id: string;
  name: string;
  score: number;
  color: string;
}

export type Difficulty = 'facil' | 'medio' | 'dificil' | 'experto';

export interface FoundWord {
  word: string;
  foundBy: string; // player id
  foundByName: string;
  cells: Array<{ row: number; col: number }>;
  color: string;
}

export interface GameRoom {
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  difficulty: Difficulty;
  players: Record<string, Player>;
  grid?: string[][];
  words?: string[];
  foundWords?: Record<string, FoundWord>;
  createdAt: number;
}

export type RootStackParamList = {
  Home: undefined;
  Lobby: {
    roomCode: string;
    playerId: string;
    playerName: string;
    isHost: boolean;
  };
  Game: {
    roomCode: string;
    playerId: string;
    playerName: string;
    playerColor: string;
  };
  Solo: {
    playerName: string;
    difficulty: Difficulty;
  };
};
