import React from 'react';
import CustomFieldBuilder from '../../components/customFields/CustomFieldBuilder';

export const HostelAllocationFieldsPage = () => (
  <CustomFieldBuilder
    entityType="HOSTEL_ALLOCATION"
    title="Hostel Allocation Form Builder"
    subtitle="Add extra fields on top of the standard bed allocation form — each one goes live only once SuperAdmin approves it"
    liveDescription={<>Fields you add start as <strong>Draft</strong> — edit them freely. Once submitted, a field is <strong>locked for review</strong> and only appears on the real Allocate Bed form after SuperAdmin marks it <strong>Live</strong>. Editing an already-live field re-submits it for review.</>}
    emptyDescription="Add fields your hostel allocation needs beyond room and bed — a room preference, a dietary requirement, anything specific to your institution."
  />
);

export default HostelAllocationFieldsPage;
