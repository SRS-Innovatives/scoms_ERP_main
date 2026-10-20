/**
 * @format
 */

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { App as ScomsStaffApp } from './src/app/App';

function App() {
  return (
    <SafeAreaProvider>
      <ScomsStaffApp />
    </SafeAreaProvider>
  );
}

export default App;
