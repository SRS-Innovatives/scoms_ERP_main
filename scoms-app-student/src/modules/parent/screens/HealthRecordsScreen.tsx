import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { colors, moduleColors } from '../../../constants/theme';
import { badge, RecordTimeline, TimelineItem } from '../components/RecordTimeline';
import { fetchHealthRecords, HealthRecord } from '../services/parentRecordsService';
import { queryKeys } from '../../../services/api/queryKeys';

const toItem = (r: HealthRecord): TimelineItem => ({
  id: r.id,
  date: r.visitDate,
  title: r.diagnosis || r.symptoms || 'Sick-room visit',
  badges: [
    ...(r.referredToHospital ? [badge('REFERRED TO HOSPITAL', colors.danger, colors.dangerLight, 'local-hospital')] : []),
    r.parentNotified
      ? badge('YOU WERE NOTIFIED', colors.success, colors.successLight, 'notifications-active')
      : badge('INFO ONLY', colors.textSecondary, colors.surfaceMuted, 'info-outline'),
  ],
  lines: [
    { label: 'SYMPTOMS', value: r.diagnosis ? r.symptoms : null }, // already the title when there's no diagnosis
    { label: 'ACTION TAKEN', value: r.actionTaken },
  ],
  footer: r.recordedBy ? `Recorded by ${r.recordedBy}` : null,
  emphasis: r.referredToHospital,
});

export function HealthRecordsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({ queryKey: queryKeys.health, queryFn: fetchHealthRecords });
  const recent = (data ?? []).filter((r) => Date.now() - new Date(r.visitDate).getTime() < 30 * 86_400_000).length;
  const referred = (data ?? []).filter((r) => r.referredToHospital).length;

  return (
    <RecordTimeline
      tint={moduleColors.health}
      icon="favorite"
      heading="Health"
      stats={[
        { label: 'Visits', value: data?.length ?? 0 },
        { label: 'Last 30 days', value: recent },
        { label: 'Hospital', value: referred },
      ]}
      items={data?.map(toItem)}
      isLoading={isLoading}
      isError={isError}
      refreshing={isRefetching}
      onRefresh={() => {
        refetch();
      }}
      emptyTitle="No sick-room visits 💪"
      emptyMessage="Visits to the school nurse or sick room will appear here."
    />
  );
}
