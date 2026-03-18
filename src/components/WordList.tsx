import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FoundWord } from '../types';

interface WordListProps {
  words: string[];
  foundWords: Record<string, FoundWord>;
}

export default function WordList({ words, foundWords }: WordListProps) {
  return (
    <View style={styles.container}>
      {words.map((word) => {
        const found = foundWords[word];
        return (
          <View key={word} style={styles.wordRow}>
            <Text
              style={[
                styles.word,
                found && { textDecorationLine: 'line-through', color: found.color },
              ]}
            >
              {word}
            </Text>
            {found && (
              <Text style={[styles.foundBy, { color: found.color }]}>
                {found.foundByName}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  wordRow: {
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 6,
  },
  word: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A237E',
  },
  foundBy: {
    fontSize: 10,
    fontWeight: '400',
  },
});
