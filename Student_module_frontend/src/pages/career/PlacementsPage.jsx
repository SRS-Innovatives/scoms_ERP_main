import React from 'react';
import InternshipsPage from './InternshipsPage';

export const PlacementsPage = () => {
  return (
    <InternshipsPage
      postingType="PLACEMENT"
      title="Campus Placement Drives"
      subtitle="Apply for full-time placement openings posted by your institution's Placement Cell."
    />
  );
};

export default PlacementsPage;
