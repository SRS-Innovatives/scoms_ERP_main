import React from 'react';
import CustomFieldBuilder from '../../components/customFields/CustomFieldBuilder';

export const FeeAssignmentFieldsPage = () => (
  <CustomFieldBuilder
    entityType="FEE_ASSIGNMENT"
    title="Fee Assignment Form Builder"
    subtitle="Add extra fields on top of the standard fee assignment form — each one goes live only once SuperAdmin approves it"
    liveDescription={<>Fields you add start as <strong>Draft</strong> — edit them freely. Once submitted, a field is <strong>locked for review</strong> and only appears on the real Assign Fee form after SuperAdmin marks it <strong>Live</strong>. Editing an already-live field re-submits it for review.</>}
    emptyDescription="Add fields your fee assignment needs beyond amount and structure — a sponsor name, a concession reference, anything specific to your institution."
  />
);

export default FeeAssignmentFieldsPage;
