import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AppText from './AppText';
import { supabase } from '../supabase';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSizes } from '../theme';

type Props = {
  userId: string;
  badgeText?: string;
};

export default function UserListItem({ userId, badgeText }: Props) {
  const navigation = useNavigation();
  const [user, setUser] = useState<{ id: string; username?: string; avatar_url?: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single();

      if (!error && data) setUser(data);
    })();
  }, [userId]);

  if (!user) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
    >
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <AppText style={styles.avatarInitial}>
            {user.username?.charAt(0).toUpperCase() || '?'}
          </AppText>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <AppText style={styles.username}>{user.username || 'User'}</AppText>
        {badgeText ? <AppText style={styles.badge}>{badgeText}</AppText> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    marginRight: spacing.medium,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.medium,
  },
  avatarPlaceholder: {
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  username: {
    fontSize: fontSizes.body,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  badge: {
    fontSize: fontSizes.small,
    color: '#ffa500',
  },
});
