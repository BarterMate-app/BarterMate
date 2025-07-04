// File: src/screens/WriteReviewScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useUser } from '../utils/useUser';
import { createUserReview } from '../services/reviewsService';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import { colors, spacing, typography } from '../theme';;

type WriteReviewRouteProp = RouteProp<RootStackParamList, 'WriteReview'>;

export default function WriteReviewScreen() {
  const route = useRoute<WriteReviewRouteProp>();
  const navigation = useNavigation();
  const { user } = useUser();

  const { revieweeId, tradeHistoryId } = route.params;

  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState('');

  const handleSubmit = async () => {
    if (!rating || rating < 1 || rating > 5) {
      Alert.alert('Please select a rating between 1 and 5 stars.');
      return;
    }

    try {
      await createUserReview({
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        review,
        trade_history_id: tradeHistoryId,
      });
      Alert.alert('Review submitted! Thank you.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Failed to submit review.');
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppText style={styles.label}>Rate the user (1 to 5 stars):</AppText>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <AppText
            key={star}
            style={[styles.star, star <= rating ? styles.selectedStar : undefined]}
            onPress={() => setRating(star)}
          >
            ★
          </AppText>
        ))}
      </View>

      <AppText style={styles.label}>Write your review (optional):</AppText>
      <AppTextInput
        style={styles.textInput}
        multiline
        numberOfLines={4}
        value={review}
        onChangeText={setReview}
        placeholder="Share your experience..."
      />

      <AppButton title="Submit Review" onPress={handleSubmit} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: colors.background },
  label: { fontSize: 18, marginBottom: 8 },
  starsContainer: { flexDirection: 'row', marginBottom: 20 },
  star: { fontSize: 32, color: '#ccc', marginHorizontal: 6 },
  selectedStar: { color: '#FFD700' },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
});
