import React from 'react';
import CustomFieldBuilder from '../../components/customFields/CustomFieldBuilder';

export const AdmissionFormBuilderPage = () => (
  <CustomFieldBuilder
    entityType="ADMISSION"
    title="Admission Form Builder"
    subtitle="Add extra fields on top of the standard admission form — each one goes live only once SuperAdmin approves it"
    liveDescription={<>Fields you add start as <strong>Draft</strong> — edit them freely. Once submitted, a field is <strong>locked for review</strong> and only appears on your real admission form (and public application form) after SuperAdmin marks it <strong>Live</strong>. Editing an already-live field re-submits it for review.</>}
    emptyDescription="Add fields your admission form needs beyond the standard set — a consent checkbox, a scholarship code, anything specific to your institution."
  />
);

export default AdmissionFormBuilderPage;
