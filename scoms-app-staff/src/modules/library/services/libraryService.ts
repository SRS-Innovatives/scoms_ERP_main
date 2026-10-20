import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface LibraryStudent {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  admissionNumber: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  availableCopies: number;
}

export interface BookIssue {
  id: string;
  dueDate: string;
  returnedAt: string | null;
  fineAmount: number;
  finePaid: boolean;
  book: { title: string; author?: string };
  student: { firstName: string; lastName: string; rollNumber: string };
}

export async function searchStudents(q: string): Promise<LibraryStudent[]> {
  const { data } = await apiClient.get<ApiEnvelope<LibraryStudent[]>>('/library/students', { params: { q } });
  return data.data;
}

export async function searchBooks(q: string): Promise<LibraryBook[]> {
  const { data } = await apiClient.get<ApiEnvelope<LibraryBook[]>>('/library/books', { params: { q } });
  return data.data;
}

export async function issueBook(bookId: string, studentId: string) {
  const { data } = await apiClient.post<ApiEnvelope<BookIssue>>('/library/issue', { bookId, studentId });
  return data.data;
}

export async function fetchActiveIssues(): Promise<BookIssue[]> {
  const { data } = await apiClient.get<ApiEnvelope<BookIssue[]>>('/library/issues');
  return data.data;
}

export async function returnBook(issueId: string) {
  const { data } = await apiClient.post<ApiEnvelope<BookIssue>>('/library/return', { issueId });
  return data.data;
}

export async function fetchFines(): Promise<BookIssue[]> {
  const { data } = await apiClient.get<ApiEnvelope<BookIssue[]>>('/library/fines');
  return data.data;
}

export async function collectFine(issueId: string) {
  await apiClient.patch(`/library/fines/${issueId}/collect`);
}
