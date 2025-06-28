import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessageBubble({ message, isOwn }: { message: string; isOwn: boolean }) {
  return (
    <View style={[styles.bubble, isOwn ? styles.own : styles.their]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
    maxWidth: '75%',
  },
  own: {
    alignSelf: 'flex-end',
    backgroundColor: '#acf',
  },
  their: {
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
  },
  text: {
    fontSize: 16,
  },
});
