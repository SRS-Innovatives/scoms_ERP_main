import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { colors, moduleColors } from '../../../constants/theme';
import { badge, RecordTimeline, TimelineItem } from '../components/RecordTimeline';
import { DisciplineRecord, fetchDisciplineRecords } from '../services/parentRecordsService';
import { queryKeys } from '../../../services/api/queryKeys';

const SEVERITY: Record<string, { label: string; color: string; bg: string }> = {
  MINOR: { label: 'Minor', color: '#B45309', bg: colors.warningLight },
  MAJOR: { label: 'Major', color: '#C2410C', bg: '#FFEDD5' },
  SEVERE: { label: 'Severe', color: colors.danger, bg: colors.dangerLight },
};

const toItem = (r: DisciplineRecord): TimelineItem => {
  const sev = SEVERITY[r.category] ?? { label: r.category, color: colors.textSecondary, bg: colors.surfaceMuted };
  const open = r.status === 'OPEN';
  return {
    id: r.id,
    date: r.incidentDate,
    title: `${sev.label} incident`,
    badges: [
      badge(sev.label.toUpperCase(), sev.color, sev.bg, 'flag'),
      open ? badge('OPEN', colors.warning, colors.warningLight, 'schedule') : badge('RESOLVED', colors.success, colors.successLight, 'check-circle'),
    ],
    body: r.description,
    lines: [{ label: 'ACTION TAKEN', value: r.actionTaken }],
    footer: r.reportedBy ? `Reported by ${r.reportedBy}${r.reportedByDesignation ? ` · ${r.reportedByDesignation}` : ''}` : null,
    emphasis: open,
  };
};

export function DisciplineScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({ queryKey: queryKeys.discipline, queryFn: fetchDisciplineRecords });
  const open = (data ?? []).filter((r) => r.status === 'OPEN').length;

  return (
    <RecordTimeline
      tint={moduleColors.discipline}
      icon="gavel"
      heading="Discipline"
      stats={[
        { label: 'Total', value: data?.length ?? 0 },
        { label: 'Open', value: open },
        { label: 'Resolved', value: (data?.length ?? 0) - open },
      ]}
      items={data?.map(toItem)}
      isLoading={isLoading}
      isError={isError}
      refreshing={isRefetching}
      onRefresh={() => {
        refetch();
      }}
      emptyTitle="No incidents recorded 🌟"
      emptyMessage="Great news — the school hasn't logged any conduct issues."
    />
  );
}
