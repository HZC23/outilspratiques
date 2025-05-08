export const CONFIG = {
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 3000,
    MAX_HISTORY_ITEMS: 10,
    DEBOUNCE_DELAY: 300,
    STORAGE_KEYS: {
        THEME: 'theme',
        CALCULATOR_HISTORY: 'calculatorHistory',
        NOTES: 'notes',
        STYLE_HISTORY: 'styleHistory',
        TODO_LIST: 'todoList',
        LAST_SYNC: 'lastSync',
        AUTH_TOKEN: 'sb-brrwkmcokfrlcsyduoxq-auth-token'
    },
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },
    API: {
        TRANSLATE_URL: 'https://translation.googleapis.com/language/translate/v2',
        WEATHER_URL: 'https://api.openweathermap.org/data/2.5/weather'
    },
    SYNC: {
        AUTO_SYNC: true,
        INTERVAL: 60000
    }
}; 