import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { ModuleKey } from './moduleKeys';
import { useModuleLayout } from './moduleRegistry';

/** Opens a module screen from anywhere inside the tab navigator, whether that module is
 * currently a bottom tab or lives inside More. No-op for a hidden module. */
export function useOpenModule() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { tabs, more } = useModuleLayout();
  return (key: ModuleKey) => {
    const tab = tabs.find((m) => m.key === key);
    if (tab) return navigation.navigate(tab.screen);
    const inMore = more.find((m) => m.key === key);
    if (inMore) return navigation.navigate('More', { screen: inMore.screen });
    return undefined;
  };
}
