import React from 'react';
import CustomFieldBuilder from '../../components/customFields/CustomFieldBuilder';

export const TransportEnrollmentFieldsPage = () => (
  <CustomFieldBuilder
    entityType="TRANSPORT_ENROLLMENT"
    title="Transport Enrollment Form Builder"
    subtitle="Add extra fields on top of the standard bus route assignment form — each one goes live only once SuperAdmin approves it"
    liveDescription={<>Fields you add start as <strong>Draft</strong> — edit them freely. Once submitted, a field is <strong>locked for review</strong> and only appears on the real Assign Student to Route form after SuperAdmin marks it <strong>Live</strong>. Editing an already-live field re-submits it for review.</>}
    emptyDescription="Add fields your transport enrollment needs beyond pickup point and route — an emergency contact, a preferred boarding time, anything specific to your institution."
  />
);

export default TransportEnrollmentFieldsPage;
