import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { StudentAuthProvider } from './context/StudentAuthContext';
import { InstitutionProvider } from './context/InstitutionContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <StudentAuthProvider>
            <InstitutionProvider>
              <AppRoutes />
            </InstitutionProvider>
          </StudentAuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
