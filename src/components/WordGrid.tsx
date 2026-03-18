import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FoundWord } from '../types';

interface WordGridProps {
  grid: string[][];
  foundWords: Record<string, FoundWord>;
  onWordFound: (cells: Array<{ row: number; col: number }>, word: string) => void;
  playerColor: string;
}

const PADDING = 8;

export default function WordGrid({
  grid,
  foundWords,
  onWordFound,
  playerColor,
}: WordGridProps) {
  const size = grid.length;
  const screenWidth = Dimensions.get('window').width;
  const cellSize = Math.floor((screenWidth - PADDING * 2) / size);

  const [selectedCells, setSelectedCells] = useState<Array<{ row: number; col: number }>>([]);
  const startCell = useRef<{ row: number; col: number } | null>(null);

  const foundCellMap = useRef<Map<string, string>>(new Map());
  foundCellMap.current = new Map();
  Object.values(foundWords).forEach((fw) => {
    fw.cells.forEach((cell) => {
      foundCellMap.current.set(`${cell.row},${cell.col}`, fw.color);
    });
  });

  const getCellFromPosition = useCallback(
    (localX: number, localY: number): { row: number; col: number } | null => {
      const col = Math.floor(localX / cellSize);
      const row = Math.floor(localY / cellSize);
      if (row >= 0 && row < size && col >= 0 && col < size) {
        return { row, col };
      }
      return null;
    },
    [cellSize, size],
  );

  const getCellsInLine = useCallback(
    (
      from: { row: number; col: number },
      to: { row: number; col: number },
    ): Array<{ row: number; col: number }> => {
      const dr = to.row - from.row;
      const dc = to.col - from.col;
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      if (steps === 0) return [from];

      const isDiagonal = Math.abs(dr) === Math.abs(dc);
      const isHorizontal = dr === 0;
      const isVertical = dc === 0;
      if (!isHorizontal && !isVertical && !isDiagonal) return [from];

      const stepR = steps === 0 ? 0 : dr / steps;
      const stepC = steps === 0 ? 0 : dc / steps;
      const cells: Array<{ row: number; col: number }> = [];
      for (let i = 0; i <= steps; i++) {
        cells.push({
          row: Math.round(from.row + i * stepR),
          col: Math.round(from.col + i * stepC),
        });
      }
      return cells;
    },
    [],
  );

  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      const cell = getCellFromPosition(
        e.nativeEvent.locationX,
        e.nativeEvent.locationY,
      );
      if (cell) {
        startCell.current = cell;
        setSelectedCells([cell]);
      }
    },
    [getCellFromPosition],
  );

  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      if (!startCell.current) return;
      const cell = getCellFromPosition(
        e.nativeEvent.locationX,
        e.nativeEvent.locationY,
      );
      if (cell) {
        const line = getCellsInLine(startCell.current, cell);
        setSelectedCells(line);
      }
    },
    [getCellFromPosition, getCellsInLine],
  );

  const handleTouchEnd = useCallback(() => {
    if (selectedCells.length < 2) {
      setSelectedCells([]);
      startCell.current = null;
      return;
    }
    const word = selectedCells.map((c) => grid[c.row][c.col]).join('');
    onWordFound(selectedCells, word);
    setSelectedCells([]);
    startCell.current = null;
  }, [selectedCells, grid, onWordFound]);

  const selectedSet = new Set(selectedCells.map((c) => `${c.row},${c.col}`));

  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouchStart}
      onResponderMove={handleTouchMove}
      onResponderRelease={handleTouchEnd}
      onResponderTerminate={handleTouchEnd}
      style={[
        styles.gridContainer,
        { width: cellSize * size, height: cellSize * size },
      ]}
    >
      <LinearGradient
        colors={['#E8EAF6', '#F0F4FF', '#E8EAF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: cellSize * size,
          height: cellSize * size,
          position: 'absolute',
        }}
      />
      <View
        style={[
          styles.grid,
          { width: cellSize * size, height: cellSize * size },
        ]}
      >
        {grid.map((row, rIdx) =>
          row.map((letter, cIdx) => {
            const key = `${rIdx},${cIdx}`;
            const isSelected = selectedSet.has(key);
            const foundColor = foundCellMap.current.get(key);

            let bgColor = 'transparent';
            if (isSelected) bgColor = '#FFD600';
            else if (foundColor) bgColor = foundColor + '55';

            let textColor = '#1A237E';
            if (isSelected) textColor = '#000';
            else if (foundColor) textColor = foundColor;

            return (
              <View
                key={key}
                pointerEvents="none"
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: bgColor,
                    left: cIdx * cellSize,
                    top: rIdx * cellSize,
                  },
                ]}
              >
                <Text
                  pointerEvents="none"
                  style={[
                    styles.letter,
                    { fontSize: cellSize * 0.5, color: textColor },
                    isSelected && styles.selectedLetter,
                    !!foundColor && { fontWeight: 'bold' },
                  ]}
                >
                  {letter}
                </Text>
              </View>
            );
          }),
        )}
        {Object.values(foundWords).map((fw) =>
          fw.cells.map((cell) => {
            const key = `found-${fw.word}-${cell.row}-${cell.col}`;
            return (
              <View
                key={key}
                pointerEvents="none"
                style={[
                  styles.foundOverlay,
                  {
                    width: cellSize,
                    height: cellSize,
                    left: cell.col * cellSize,
                    top: cell.row * cellSize,
                    backgroundColor: fw.color + '66',
                    borderColor: fw.color,
                  },
                ]}
              />
            );
          }),
        )}
        {selectedCells.map((cell) => (
          <View
            key={`sel-${cell.row}-${cell.col}`}
            pointerEvents="none"
            style={[
              styles.selectionOverlay,
              {
                width: cellSize,
                height: cellSize,
                left: cell.col * cellSize,
                top: cell.row * cellSize,
                backgroundColor: playerColor + '66',
                borderColor: playerColor,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    position: 'relative',
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  grid: {
    position: 'relative',
    alignSelf: 'center',
  },
  cell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
    borderColor: '#D0D4E6',
    backgroundColor: '#FAFBFF',
  },
  letter: {
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A237E',
  },
  selectedLetter: {
    fontWeight: 'bold',
  },
  foundOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 2,
  },
  selectionOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 2,
  },
});
