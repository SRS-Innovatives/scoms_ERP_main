import React from 'react';
import CustomFieldBuilder from '../../components/customFields/CustomFieldBuilder';

export const LibraryMembershipFieldsPage = () => (
  <CustomFieldBuilder
    entityType="LIBRARY_MEMBERSHIP"
    title="Library Membership Form Builder"
    subtitle="Add extra fields on top of the standard library membership registration — each one goes live only once SuperAdmin approves it"
    liveDescription={<>Fields you add start as <strong>Draft</strong> — edit them freely. Once submitted, a field is <strong>locked for review</strong> and only appears on the real Register Member form after SuperAdmin marks it <strong>Live</strong>. Editing an already-live field re-submits it for review.</>}
    emptyDescription="Add fields your library membership needs beyond membership number — a card color, a borrowing limit tier, anything specific to your institution."
  />
);

export default LibraryMembershipFieldsPage;
