import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { moduleColors } from '../../../constants/theme';
import { badge, RecordTimeline, TimelineItem } from '../components/RecordTimeline';
import { fetchPtmNotes, PtmNote } from '../services/parentRecordsService';
import { queryKeys } from '../../../services/api/queryKeys';

const tint = moduleColors.ptm;

const toItem = (n: PtmNote): TimelineItem => ({
  id: n.id,
  date: n.meetingDate,
  title: n.teacher ? `Meeting with ${n.teacher}` : 'Parent-teacher meeting',
  badges: n.teacherDesignation ? [badge(n.teacherDesignation.toUpperCase(), tint.solid, tint.soft, 'school')] : [],
  body: n.discussionNotes,
  footer: n.parentName ? `Attended by ${n.parentName}` : null,
});

export function PtmNotesScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({ queryKey: queryKeys.ptm, queryFn: fetchPtmNotes });
  const thisYear = (data ?? []).filter((n) => new Date(n.meetingDate).getFullYear() === new Date().getFullYear()).length;
  const teachers = new Set((data ?? []).map((n) => n.teacher).filter(Boolean)).size;

  return (
    <RecordTimeline
      tint={tint}
      icon="forum"
      heading="PTM Notes"
      stats={[
        { label: 'Meetings', value: data?.length ?? 0 },
        { label: 'This year', value: thisYear },
        { label: 'Teachers', value: teachers },
      ]}
      items={data?.map(toItem)}
      isLoading={isLoading}
      isError={isError}
      refreshing={isRefetching}
      onRefresh={() => {
        refetch();
      }}
      emptyTitle="No meeting notes yet"
      emptyMessage="After a parent-teacher meeting, the teacher's notes will show up here."
    />
  );
}
