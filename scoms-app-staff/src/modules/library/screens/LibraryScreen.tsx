import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import {
  BookIssue,
  LibraryBook,
  LibraryStudent,
  collectFine,
  fetchActiveIssues,
  fetchFines,
  issueBook,
  returnBook,
  searchBooks,
  searchStudents,
} from '../services/libraryService';

type Tab = 'issue' | 'active' | 'fines';

function IssueBookTab() {
  const [bookQuery, setBookQuery] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [students, setStudents] = useState<LibraryStudent[]>([]);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<LibraryStudent | null>(null);
  const [issuing, setIssuing] = useState(false);

  const runBookSearch = async (q: string) => {
    setBookQuery(q);
    if (q.length < 2) return setBooks([]);
    setBooks(await searchBooks(q).catch(() => []));
  };

  const runStudentSearch = async (q: string) => {
    setStudentQuery(q);
    if (q.length < 2) return setStudents([]);
    setStudents(await searchStudents(q).catch(() => []));
  };

  const handleIssue = async () => {
    if (!selectedBook || !selectedStudent) return;
    setIssuing(true);
    try {
      await issueBook(selectedBook.id, selectedStudent.id);
      Alert.alert('Issued', `${selectedBook.title} issued to ${selectedStudent.firstName} ${selectedStudent.lastName}`);
      setSelectedBook(null);
      setSelectedStudent(null);
      setBookQuery('');
      setStudentQuery('');
      setBooks([]);
      setStudents([]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not issue this book.');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <View style={styles.content}>
      <TextField
        label="Search book by title/author"
        value={selectedBook ? selectedBook.title : bookQuery}
        onChangeText={(t) => { setSelectedBook(null); runBookSearch(t); }}
      />
      {!selectedBook && books.map((b) => (
        <TouchableOpacity key={b.id} onPress={() => { setSelectedBook(b); setBooks([]); }}>
          <Card style={styles.resultCard}>
            <Text style={styles.title}>{b.title}</Text>
            <Text style={styles.meta}>{b.author} · {b.availableCopies} available</Text>
          </Card>
        </TouchableOpacity>
      ))}

      <TextField
        label="Search student by name/roll no."
        value={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : studentQuery}
        onChangeText={(t) => { setSelectedStudent(null); runStudentSearch(t); }}
      />
      {!selectedStudent && students.map((s) => (
        <TouchableOpacity key={s.id} onPress={() => { setSelectedStudent(s); setStudents([]); }}>
          <Card style={styles.resultCard}>
            <Text style={styles.title}>{s.firstName} {s.lastName}</Text>
            <Text style={styles.meta}>Roll {s.rollNumber}</Text>
          </Card>
        </TouchableOpacity>
      ))}

      <Button
        label="Issue Book"
        onPress={handleIssue}
        loading={issuing}
        disabled={!selectedBook || !selectedStudent}
        style={styles.actionButton}
      />
    </View>
  );
}

function ActiveIssuesTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['library', 'activeIssues'], queryFn: fetchActiveIssues });

  const handleReturn = async (issue: BookIssue) => {
    try {
      await returnBook(issue.id);
      queryClient.invalidateQueries({ queryKey: ['library'] });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not return this book.');
    }
  };

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;
  if (!data?.length) return <EmptyView title="No active issues" />;

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Text style={styles.title}>{item.book.title}</Text>
          <Text style={styles.meta}>{item.student.firstName} {item.student.lastName} · Roll {item.student.rollNumber}</Text>
          <Text style={styles.meta}>Due {new Date(item.dueDate).toLocaleDateString()}</Text>
          <Button label="Mark Returned" variant="secondary" onPress={() => handleReturn(item)} style={styles.actionButton} />
        </Card>
      )}
    />
  );
}

function FinesTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['library', 'fines'], queryFn: fetchFines });

  const handleCollect = async (issue: BookIssue) => {
    try {
      await collectFine(issue.id);
      queryClient.invalidateQueries({ queryKey: ['library'] });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not collect this fine.');
    }
  };

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;

  const unpaid = (data ?? []).filter((f) => !f.finePaid);
  if (!unpaid.length) return <EmptyView title="No outstanding fines" />;

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={unpaid}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Text style={styles.title}>{item.book.title}</Text>
          <Text style={styles.meta}>{item.student.firstName} {item.student.lastName}</Text>
          <Text style={[styles.meta, { color: colors.danger }]}>₹{item.fineAmount} fine due</Text>
          <Button label="Collect Fine" onPress={() => handleCollect(item)} style={styles.actionButton} />
        </Card>
      )}
    />
  );
}

export function LibraryScreen() {
  const [tab, setTab] = useState<Tab>('issue');

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Text style={[styles.tab, tab === 'issue' && styles.tabActive]} onPress={() => setTab('issue')}>Issue</Text>
        <Text style={[styles.tab, tab === 'active' && styles.tabActive]} onPress={() => setTab('active')}>Active</Text>
        <Text style={[styles.tab, tab === 'fines' && styles.tabActive]} onPress={() => setTab('fines')}>Fines</Text>
      </View>
      {tab === 'issue' && <IssueBookTab />}
      {tab === 'active' && <ActiveIssuesTab />}
      {tab === 'fines' && <FinesTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', padding: spacing.md, gap: spacing.lg },
  tab: { ...typography.body, color: colors.textSecondary, paddingBottom: spacing.xs },
  tabActive: { color: colors.primary, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: colors.primary },
  content: { padding: spacing.md },
  card: { marginBottom: spacing.sm },
  resultCard: { marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  actionButton: { marginTop: spacing.sm },
});
