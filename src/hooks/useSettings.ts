import { useState, useEffect } from 'react';

type Units = 'metric' | 'imperial';
type ThemeMode = 'light' | 'dark';

interface Settings {
  units: Units;
  theme: ThemeMode;
  language: string;
  defaultActivityType: string;
  showPrivateActivities: boolean;
  mapStyle: string;
}

const DEFAULT_SETTINGS: Settings = {
  units: 'metric',
  theme: 'dark',
  language: 'fr',
  defaultActivityType: 'all',
  showPrivateActivities: false,
  mapStyle: 'streets',
};

interface UseSettingsReturn {
  settings: Settings;
  units: Units;
  theme: ThemeMode;
  loading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('straviz_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('straviz_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('straviz_settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  return {
    settings,
    units: settings.units,
    theme: settings.theme,
    loading,
    updateSettings,
    resetSettings,
  };
};


