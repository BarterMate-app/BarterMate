import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ScreenWrapper from './ScreenWrapper';
import AppText from './AppText';

type CategoryPickerProps = {
  categories: string[];
  selected: string;
  onSelect: (value: string) => void;
};

const labelsMap: Record<string, string> = {
  service: 'Service',
  produce: 'Produce',
  products: 'Products',
  experiences: 'Experiences',
  transport: 'Transport',
  knowledge: 'Knowledge',
  other: 'Other',
  home: 'Home',
  none: 'None',
};

export default function CategoryPicker({ categories, selected, onSelect }: CategoryPickerProps) {
  return (
    <ScreenWrapper>
      <AppText style={styles.label}>Category:</AppText>
      <Picker
        selectedValue={selected}
        onValueChange={onSelect}
        style={styles.picker}
        mode="dropdown"
      >
        {categories.map((cat) => (
          <Picker.Item key={cat} label={labelsMap[cat] || cat} value={cat} />
        ))}
      </Picker>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: { fontSize: 16, marginBottom: 5 },
  picker: { height: 50, width: '100%' },
});
