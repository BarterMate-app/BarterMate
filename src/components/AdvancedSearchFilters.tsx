import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing, textStyles, fontSizes } from '../theme';

type Props = {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  keyword: string;
  onKeywordChange: (text: string) => void;
  distance: number;
  maxDistance: number;
  onDistanceChange: (value: number) => void;
};

export default function AdvancedSearchFilters({
  categories,
  selectedCategories,
  onCategoryChange,
  keyword,
  onKeywordChange,
  distance,
  maxDistance,
  onDistanceChange,
}: Props) {
  // Toggle category selection
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Search Keywords</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter keywords..."
        value={keyword}
        onChangeText={onKeywordChange}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      <Text style={styles.label}>Filter by Distance (km)</Text>
      <View style={styles.sliderContainer}>
        <Slider
          minimumValue={0}
          maximumValue={maxDistance}
          value={distance}
          onValueChange={onDistanceChange}
          step={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
        />
        <Text style={styles.distanceText}>{distance} km</Text>
      </View>

      <Text style={styles.label}>Select Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((cat) => {
          const selected = selectedCategories.includes(cat);
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selected && styles.categoryChipSelected]}
              onPress={() => toggleCategory(cat)}
            >
              <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.medium,
    backgroundColor: colors.backgroundLight || '#f9f9f9',
    borderRadius: 12,
    marginBottom: spacing.large,
  },
  label: {
    fontWeight: '600',
    fontSize: fontSizes.body,
    marginBottom: spacing.small,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.small,
    marginBottom: spacing.medium,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  distanceText: {
    marginLeft: spacing.small,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryChip: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: '#eee',
    borderRadius: 20,
    marginRight: spacing.small,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  categoryTextSelected: {
    color: '#fff',
  },
});
