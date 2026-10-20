import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '../../../navigation/types';
import { colors, spacing, typography } from '../../../constants/theme';
import { Card } from '../../../components/Card';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreMenu'>;

const ITEMS: { label: string; screen: keyof MoreStackParamList }[] = [
  { label: 'Examinations', screen: 'Examination' },
  { label: 'Fees', screen: 'Fees' },
  { label: 'Certificates', screen: 'Certificates' },
  { label: 'Notifications', screen: 'Notifications' },
  { label: 'Profile', screen: 'Profile' },
];

export function MoreMenuScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {ITEMS.map((item) => (
        <TouchableOpacity key={item.screen} onPress={() => navigation.navigate(item.screen)}>
          <Card style={styles.item}>
            <Text style={styles.label}>{item.label}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  item: { marginBottom: spacing.sm },
  label: { ...typography.h3, color: colors.textPrimary },
});
