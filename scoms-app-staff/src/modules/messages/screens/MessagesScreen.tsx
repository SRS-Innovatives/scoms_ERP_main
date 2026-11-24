import React, { useEffect, useMemo, useState } from 'react';
import { Alert, AppState, BackHandler, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, moduleColor, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Avatar } from '../../../components/Avatar';
import { useAuth } from '../../../store/AuthContext';
import { queryKeys } from '../../../services/api/queryKeys';
import { daysFromToday, shortDate, timeAgo } from '../../../utils/dates';
import { ChatMessage, ChatStudent, fetchChatStudents, fetchConversation, sendChatMessage } from '../services/messagesService';

const tint = moduleColor('messages');
const MAX = 2000;
const nameOf = (s: ChatStudent) => `${s.firstName} ${s.lastName}`.trim();
const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
const dayHeading = (iso: string) => {
  const d = daysFromToday(iso);
  return d === 0 ? 'Today' : d === -1 ? 'Yesterday' : shortDate(iso);
};

function Conversation({ student, onBack }: { student: ChatStudent; onBack: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const key = [...queryKeys.messages, 'conversation', student.userId];
  // Full thread once; then poll every 15 s for messages AFTER the newest one we have (a few
  // rows, not the last 200), only while the app is in the foreground. No socket in the app yet.
  const q = useQuery({ queryKey: key, queryFn: () => fetchConversation(student.userId), staleTime: Infinity });
  const loaded = q.isSuccess;
  useEffect(() => {
    if (!loaded) return undefined;
    const timer = setInterval(async () => {
      if (AppState.currentState !== 'active') return;
      const current = queryClient.getQueryData<ChatMessage[]>(key) ?? [];
      const newest = current[current.length - 1]?.createdAt;
      try {
        const fresh = await fetchConversation(student.userId, newest);
        if (fresh.length) {
          queryClient.setQueryData<ChatMessage[]>(key, (old) => {
            const seen = new Set((old ?? []).map((m) => m.id));
            return [...(old ?? []), ...fresh.filter((m) => !seen.has(m.id))];
          });
        }
      } catch {
        // keep what we have; the next tick retries
      }
    }, 15_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, student.userId]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const send = useMutation({
    mutationFn: (content: string) => sendChatMessage(student.userId, content),
    onSuccess: (msg) => {
      queryClient.setQueryData<ChatMessage[]>(key, (old) => [...(old ?? []), msg]);
      queryClient.invalidateQueries({ queryKey: [...queryKeys.messages, 'students'] });
    },
    onError: (err: any, content) => {
      setText(content); // give the text back so nothing typed is lost
      Alert.alert('Not sent', err?.response?.data?.message || 'Could not send the message.');
    },
  });

  const onSend = () => {
    const content = text.trim();
    if (!content || send.isPending) return;
    setText('');
    send.mutate(content);
  };

  // newest first for the inverted list, with a day heading when the day changes
  const items = useMemo(() => {
    const msgs = q.data ?? [];
    const out: ({ kind: 'msg'; m: ChatMessage } | { kind: 'day'; id: string; label: string })[] = [];
    msgs.forEach((m, i) => {
      const prev = msgs[i - 1];
      if (!prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString()) {
        out.push({ kind: 'day', id: `day-${m.id}`, label: dayHeading(m.createdAt) });
      }
      out.push({ kind: 'msg', m });
    });
    return out.reverse();
  }, [q.data]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back to chats" hitSlop={8}>
          <Icon name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Avatar name={nameOf(student)} size={38} />
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>{nameOf(student)}</Text>
          <Text style={styles.meta}>Roll {student.rollNumber}{student.section ? ` · ${student.section.name}` : ''}</Text>
        </View>
      </View>

      {q.isLoading ? (
        <LoadingView />
      ) : q.isError ? (
        <ErrorView onRetry={q.refetch} />
      ) : (
        <FlatList
          inverted
          style={styles.flex1}
          contentContainerStyle={styles.thread}
          data={items}
          keyExtractor={(it) => (it.kind === 'day' ? it.id : it.m.id)}
          ListEmptyComponent={<Text style={styles.startHint}>Say hello — {student.firstName} will get a notification.</Text>}
          renderItem={({ item }) => {
            if (item.kind === 'day') return <Text style={styles.day}>{item.label}</Text>;
            const mine = item.m.senderId === user?.id;
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, mine && styles.onTint]}>{item.m.content}</Text>
                <Text style={[styles.bubbleTime, mine && styles.onTintMuted]}>{clock(item.m.createdAt)}</Text>
              </View>
            );
          }}
        />
      )}

      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a message…"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          multiline
          maxLength={MAX}
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={!text.trim() || send.isPending}
          style={[styles.sendBtn, (!text.trim() || send.isPending) && styles.sendOff]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <Icon name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Chat with students of classes I teach. */
export function MessagesScreen() {
  const [open, setOpen] = useState<ChatStudent | null>(null);
  const [search, setSearch] = useState('');
  const q = useQuery({ queryKey: [...queryKeys.messages, 'students'], queryFn: fetchChatStudents, refetchInterval: open ? false : 120_000 });

  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? [])
      .filter((x) => !s || `${nameOf(x)} ${x.rollNumber} ${x.section?.name ?? ''}`.toLowerCase().includes(s))
      .sort((a, b) => {
        const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return tb - ta || nameOf(a).localeCompare(nameOf(b));
      });
  }, [q.data, search]);

  if (open) return <Conversation student={open} onBack={() => setOpen(null)} />;
  if (q.isLoading) return <LoadingView />;
  if (q.isError) return <ErrorView onRetry={q.refetch} />;
  if (!q.data?.length) return <EmptyView icon="chat" title="No students to message" message="You can message students in classes you teach." />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={list}
      keyExtractor={(s) => s.userId}
      keyboardShouldPersistTaps="handled"
      refreshing={q.isRefetching}
      onRefresh={q.refetch}
      ListHeaderComponent={
        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.textSecondary} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search students" placeholderTextColor={colors.textSecondary} style={styles.searchInput} />
        </View>
      }
      ListEmptyComponent={<Text style={styles.startHint}>No student matches “{search}”.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.chatRow} onPress={() => setOpen(item)} activeOpacity={0.8} accessibilityRole="button">
          <Avatar name={nameOf(item)} size={46} />
          <View style={styles.flex}>
            <View style={styles.chatTop}>
              <Text style={styles.name} numberOfLines={1}>{nameOf(item)}</Text>
              {item.lastMessage ? <Text style={styles.when}>{timeAgo(item.lastMessage.createdAt)}</Text> : null}
            </View>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessage
                ? `${item.lastMessage.fromMe ? 'You: ' : ''}${item.lastMessage.content}`
                : `Roll ${item.rollNumber}${item.section ? ` · ${item.section.name}` : ''}`}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, marginHorizontal: spacing.sm + 2 },
  flex1: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.sm + 2, height: 44, marginBottom: spacing.md, ...shadow(1) },
  searchInput: { flex: 1, marginLeft: spacing.xs, color: colors.textPrimary, paddingVertical: 0, ...typography.body },
  chatRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm + 4, marginBottom: spacing.sm, ...shadow(1) },
  chatTop: { flexDirection: 'row', alignItems: 'center' },
  name: { ...typography.body, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  when: { ...typography.caption, fontSize: 11, color: colors.textSecondary, marginLeft: spacing.sm },
  preview: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  meta: { ...typography.caption, color: colors.textSecondary },
  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, ...shadow(1) },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  thread: { padding: spacing.md },
  day: { ...typography.overline, color: colors.textSecondary, alignSelf: 'center', marginVertical: spacing.sm },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.sm },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: tint.solid, borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4, ...shadow(1) },
  bubbleText: { ...typography.body, color: colors.textPrimary },
  bubbleTime: { fontSize: 10, color: colors.textSecondary, alignSelf: 'flex-end', marginTop: 2 },
  onTint: { color: '#fff' },
  onTintMuted: { color: colors.textOnDarkMuted },
  startHint: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    ...typography.body,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: tint.solid, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
  sendOff: { opacity: 0.45 },
});
