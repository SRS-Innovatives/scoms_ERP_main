import React from 'react';
import { moduleColor } from '../../../constants/theme';
import { StatTile } from '../../../components/StatTile';
import { DeskSummary } from '../services/dashboardService';
import { ModuleScreenName } from '../../../navigation/types';

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** The key numbers for a desk role (librarian, transport manager, warden, exam admin,
 * placement officer) — straight from the dashboard summary, no extra request. */
export function DeskTiles({ desk, open }: { desk: DeskSummary; open: (screen: ModuleScreenName) => void }) {
  switch (desk.kind) {
    case 'library': {
      const c = moduleColor('library');
      const go = () => open('Library');
      return (
        <>
          <StatTile label="Books issued" value={String(desk.issued)} hint={`${desk.dueToday} due today`} icon="menu-book" accent={c} onPress={go} />
          <StatTile label="Overdue" value={String(desk.overdue)} hint="Past due date" icon="schedule" accent={moduleColor('notifications')} alert={desk.overdue > 0} onPress={go} />
          <StatTile label="Unpaid fines" value={String(desk.unpaidFines)} hint={rupees(desk.unpaidFineAmount)} icon="payments" accent={moduleColor('homework')} alert={desk.unpaidFines > 0} onPress={go} />
        </>
      );
    }
    case 'transport': {
      const c = moduleColor('transport');
      const go = () => open('Transport');
      return (
        <>
          <StatTile label="Morning trips" value={`${desk.morningDone}/${desk.vehicles}`} hint="Completed today" icon="wb-sunny" accent={c} alert={desk.morningDone < desk.vehicles} onPress={go} />
          <StatTile label="Evening trips" value={`${desk.eveningDone}/${desk.vehicles}`} hint="Completed today" icon="nights-stay" accent={moduleColor('timetable')} onPress={go} />
        </>
      );
    }
    case 'hostel': {
      const c = moduleColor('hostel');
      const go = () => open('Hostel');
      const pct = desk.beds ? Math.round((desk.occupied / desk.beds) * 100) : 0;
      return (
        <>
          <StatTile label="Beds occupied" value={`${desk.occupied}/${desk.beds}`} hint={`${pct}% full`} icon="hotel" accent={c} onPress={go} />
          <StatTile label="Vacant beds" value={String(desk.vacant)} hint="Ready to allocate" icon="bed" accent={moduleColor('attendance')} onPress={go} />
        </>
      );
    }
    case 'exam_setup': {
      const c = moduleColor('exam_setup');
      const go = () => open('ExamSetup');
      return (
        <>
          <StatTile label="Ongoing exams" value={String(desk.ongoing)} hint="Running now" icon="pending-actions" accent={c} alert={desk.ongoing > 0} onPress={go} />
          <StatTile label="Upcoming exams" value={String(desk.upcoming)} hint="Scheduled" icon="event" accent={moduleColor('timetable')} onPress={go} />
        </>
      );
    }
    case 'placement': {
      const c = moduleColor('placement');
      const go = () => open('Placement');
      return (
        <>
          <StatTile label="Open postings" value={String(desk.openPostings)} hint="Accepting applications" icon="work" accent={c} onPress={go} />
          <StatTile label="New applications" value={String(desk.newApplications)} hint="To review" icon="person-search" accent={moduleColor('homework')} alert={desk.newApplications > 0} onPress={go} />
        </>
      );
    }
    default:
      return null;
  }
}
