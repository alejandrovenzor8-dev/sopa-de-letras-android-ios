import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
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
  const containerRef = useRef<View>(null);
  const containerLayout = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Build a lookup of which cells are found and by whom
  const foundCellMap = useRef<Map<string, string>>(new Map());
  foundCellMap.current = new Map();
  Object.values(foundWords).forEach((fw) => {
    fw.cells.forEach((cell) => {
      foundCellMap.current.set(`${cell.row},${cell.col}`, fw.color);
    });
  });

  const getCellFromPosition = useCallback(
    (px: number, py: number): { row: number; col: number } | null => {
      const localX = px - containerLayout.current.x;
      const localY = py - containerLayout.current.y;
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

      // Only allow straight lines (horizontal, vertical, diagonal)
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
      const cell = getCellFromPosition(e.nativeEvent.pageX, e.nativeEvent.pageY);
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
      const cell = getCellFromPosition(e.nativeEvent.pageX, e.nativeEvent.pageY);
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
      ref={containerRef}
      onLayout={(e) => {
        containerRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
          containerLayout.current = { x: pageX, y: pageY };
        });
        // Also capture from layout event as fallback
        containerLayout.current = {
          x: e.nativeEvent.layout.x,
          y: e.nativeEvent.layout.y,
        };
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouchStart}
      onResponderMove={handleTouchMove}
      onResponderRelease={handleTouchEnd}
      onResponderTerminate={handleTouchEnd}
      style={[styles.grid, { width: cellSize * size, height: cellSize * size }]}
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
      {/* Render selection line overlay for found words */}
      {Object.values(foundWords).map((fw) =>
        fw.cells.map((cell) => {
          const key = `found-${fw.word}-${cell.row}-${cell.col}`;
          return (
            <View
              key={key}
              style={[
                styles.foundOverlay,
                {
                  width: cellSize,
                  height: cellSize,
                  left: cell.col * cellSize,
                  top: cell.row * cellSize,
                  backgroundColor: fw.color + '44',
                  borderColor: fw.color,
                },
              ]}
            />
          );
        }),
      )}
      {/* Render selection line overlay for current selection */}
      {selectedCells.map((cell) => (
        <View
          key={`sel-${cell.row}-${cell.col}`}
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
  );
}

const styles = StyleSheet.create({
  grid: {
    position: 'relative',
    alignSelf: 'center',
  },
  cell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E8EAF6',
  },
  letter: {
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedLetter: {
    fontWeight: 'bold',
  },
  foundOverlay: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 2,
  },
  selectionOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 2,
  },
});
