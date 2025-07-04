import React, { useState } from 'react';
import { Alert } from 'react-native';
import AppButton from './AppButton';
import { sendAppreciationGift } from '../services/giftService';

type Props = {
  receiverId: string;
};

export default function SendGiftButton({ receiverId }: Props) {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    Alert.prompt(
      'Send Gift',
      'Write a thank you message (optional)',
      async (text) => {
        setSending(true);
        try {
          await sendAppreciationGift(receiverId, text || '');
          Alert.alert('Success', 'Gift sent!');
        } catch (error) {
          console.error(error);
          Alert.alert('Error', 'Could not send gift.');
        }
        setSending(false);
      }
    );
  };

  return (
    <AppButton
      title={sending ? 'Sending...' : 'Send Gift 🎁'}
      onPress={handleSend}
      disabled={sending}
    />
  );
}
