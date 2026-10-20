/**
 * @format
 */

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { App as ScomsStudentApp } from './src/app/App';

function App() {
  return (
    <SafeAreaProvider>
      <ScomsStudentApp />
    </SafeAreaProvider>
  );
}

export default App;
