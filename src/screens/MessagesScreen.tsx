import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';
import { sendMessage, fetchMessages } from '../services/messagingService';

export default function MessagesScreen() {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');

  const loadMessages = async () => {
    const data = await fetchMessages('sender-id', 'recipient-id');  // Replace with real IDs in future
    setMessages(data);
  };

  const handleSend = async () => {
    await sendMessage({
      sender_id: 'sender-id',
      recipient_id: 'recipient-id',
      message: messageText,
    });
    setMessageText('');
    loadMessages();
  };

  return (
    <View style={{ padding: 20 }}>
      <FlatList
        data={messages}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => <Text>{item.message}</Text>}
      />
      <TextInput
        placeholder="Type message"
        value={messageText}
        onChangeText={setMessageText}
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      <Button title="Send" onPress={handleSend} />
    </View>
  );
}
