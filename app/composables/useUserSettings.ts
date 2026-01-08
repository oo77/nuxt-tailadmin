export interface UserSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'ru' | 'en' | 'uz';
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_sms: boolean;
  compact_mode: boolean;
  font_size: 'small' | 'medium' | 'large';
  sidebar_color?: string;
  updated_at: Date;
}

export const useUserSettings = () => {
  const settings = useState<UserSettings | null>('user-settings', () => null);
  const loading = useState<boolean>('user-settings-loading', () => false);
  const { authFetch } = useAuthFetch();

  /**
   * Загрузка настроек с сервера
   */
  const fetchSettings = async () => {
    loading.value = true;
    try {
      const data = await authFetch<UserSettings>('/api/profile/settings');
      if (data) {
        settings.value = data;
        applySettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      useNotification().error('Не удалось загрузить настройки');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Обновление настроек
   */
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    loading.value = true;
    try {
      const data = await authFetch<UserSettings>('/api/profile/settings', {
        method: 'PUT',
        body: newSettings,
      });

      if (data) {
        settings.value = data;
        applySettings(data);
        useNotification().success('Настройки сохранены');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      useNotification().error('Ошибка при сохранении настроек');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Применение настроек (тема, режим и т.д.)
   */
  const applySettings = (s: UserSettings) => {
    // 1. Тема
    const colorMode = useColorMode();
    if (s.theme === 'auto') {
      colorMode.preference = 'system';
    } else {
      colorMode.preference = s.theme;
    }

    // 2. Компактный режим
    if (import.meta.client) {
      if (s.compact_mode) {
        document.documentElement.classList.add('compact-mode');
      } else {
        document.documentElement.classList.remove('compact-mode');
      }

      // 3. Размер шрифта
      document.documentElement.setAttribute('data-font-size', s.font_size);
    }
  };

  // Инициализация при создании composable (опционально, лучше вызывать явно в компоненте)
  // if (!settings.value) fetchSettings();

  return {
    settings,
    loading,
    fetchSettings,
    updateSettings,
  };
};
