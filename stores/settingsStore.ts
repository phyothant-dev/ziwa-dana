import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

type SettingsState = {
  language: "en" | "mm";

  themeColor: string;

  textColorMode: "light" | "dark";

  setLanguage: (language: "en" | "mm") => Promise<void>;

  setThemeColor: (color: string) => Promise<void>;

  setTextColorMode: (mode: "light" | "dark") => Promise<void>;

  loadSettings: () => Promise<void>;
};

const DEFAULT_LANGUAGE = "mm";

const DEFAULT_THEME_COLOR = "#1D9E75";

const DEFAULT_TEXT_COLOR_MODE = "light";

export const useSettingsStore = create<SettingsState>((set) => ({
  language: DEFAULT_LANGUAGE,

  themeColor: DEFAULT_THEME_COLOR,

  textColorMode: DEFAULT_TEXT_COLOR_MODE,

  setLanguage: async (language) => {
    await AsyncStorage.setItem("language", language);

    set({ language });
  },

  setThemeColor: async (themeColor) => {
    await AsyncStorage.setItem("themeColor", themeColor);

    set({ themeColor });
  },

  setTextColorMode: async (textColorMode) => {
    await AsyncStorage.setItem("textColorMode", textColorMode);

    set({ textColorMode });
  },

  loadSettings: async () => {
    const savedLanguage = await AsyncStorage.getItem("language");

    const savedThemeColor = await AsyncStorage.getItem("themeColor");

    const savedTextColorMode = await AsyncStorage.getItem("textColorMode");

    set({
      language: (savedLanguage as "en" | "mm") || DEFAULT_LANGUAGE,

      themeColor: savedThemeColor || DEFAULT_THEME_COLOR,

      textColorMode:
        (savedTextColorMode as "light" | "dark") || DEFAULT_TEXT_COLOR_MODE,
    });
  },
}));
