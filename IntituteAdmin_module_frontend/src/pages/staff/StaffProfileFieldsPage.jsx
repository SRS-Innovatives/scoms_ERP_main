import React from 'react';
import CustomFieldBuilder from '../../components/customFields/CustomFieldBuilder';

export const StaffProfileFieldsPage = () => (
  <CustomFieldBuilder
    entityType="STAFF_PROFILE"
    title="Staff Registration Form Builder"
    subtitle="Add extra fields on top of the standard staff registration form — each one goes live only once SuperAdmin approves it"
    liveDescription={<>Fields you add start as <strong>Draft</strong> — edit them freely. Once submitted, a field is <strong>locked for review</strong> and only appears on your real Staff Registration form after SuperAdmin marks it <strong>Live</strong>. Editing an already-live field re-submits it for review.</>}
    emptyDescription="Add fields your staff registration form needs beyond the standard set — a certification number, a union membership ID, anything specific to your institution."
  />
);

export default StaffProfileFieldsPage;
