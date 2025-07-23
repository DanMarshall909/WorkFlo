export type Theme = 'light' | 'dark' | 'system' | 'earth' | 'forest' | 'desert' | 'desert-night' | 'ocean' | 'stone';

export interface ThemeConfig {
  theme: Theme;
  colors: {
    // Background colors
    background: string;
    surface: string;
    surfaceVariant: string;

    // Text colors
    onBackground: string;
    onSurface: string;
    onSurfaceVariant: string;

    // Primary colors (Focus)
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;

    // Secondary colors (Energy)
    secondary: string;
    onSecondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;

    // Tertiary colors (Deep)
    tertiary: string;
    onTertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;

    // State colors
    error: string;
    onError: string;
    warning: string;
    onWarning: string;
    success: string;
    onSuccess: string;

    // Borders and dividers
    border: string;
    borderVariant: string;
    divider: string;
  };
}

export const lightTheme: ThemeConfig = {
  theme: 'light',
  colors: {
    // Backgrounds
    background: '#f9fafb', // calm-50
    surface: '#ffffff',
    surfaceVariant: '#f3f4f6', // calm-100

    // Text
    onBackground: '#111827', // calm-900
    onSurface: '#374151', // calm-700
    onSurfaceVariant: '#6b7280', // calm-500

    // Primary (Focus green)
    primary: '#22c55e', // focus-500
    onPrimary: '#ffffff',
    primaryContainer: '#dcf4e4', // focus-100
    onPrimaryContainer: '#15803d', // focus-700

    // Secondary (Energy orange)
    secondary: '#f97316', // energy-500
    onSecondary: '#ffffff',
    secondaryContainer: '#ffedd5', // energy-100
    onSecondaryContainer: '#c2410c', // energy-700

    // Tertiary (Deep purple)
    tertiary: '#a855f7', // deep-500
    onTertiary: '#ffffff',
    tertiaryContainer: '#f3e8ff', // deep-100
    onTertiaryContainer: '#7c3aed', // deep-700

    // States
    error: '#ef4444',
    onError: '#ffffff',
    warning: '#f59e0b',
    onWarning: '#ffffff',
    success: '#10b981',
    onSuccess: '#ffffff',

    // Borders
    border: '#e5e7eb', // calm-200
    borderVariant: '#d1d5db', // calm-300
    divider: '#f3f4f6', // calm-100
  },
};

export const darkTheme: ThemeConfig = {
  theme: 'dark',
  colors: {
    // Backgrounds
    background: '#0f172a', // slate-900
    surface: '#1e293b', // slate-800
    surfaceVariant: '#334155', // slate-700

    // Text
    onBackground: '#f1f5f9', // slate-100
    onSurface: '#e2e8f0', // slate-200
    onSurfaceVariant: '#94a3b8', // slate-400

    // Primary (Focus green - adjusted for dark)
    primary: '#4ade80', // green-400
    onPrimary: '#052e16', // green-950
    primaryContainer: '#166534', // green-800
    onPrimaryContainer: '#bbf7d0', // green-200

    // Secondary (Energy orange - adjusted for dark)
    secondary: '#fb923c', // orange-400
    onSecondary: '#431407', // orange-950
    secondaryContainer: '#ea580c', // orange-600
    onSecondaryContainer: '#fed7aa', // orange-200

    // Tertiary (Deep purple - adjusted for dark)
    tertiary: '#c084fc', // purple-400
    onTertiary: '#581c87', // purple-900
    tertiaryContainer: '#7c3aed', // purple-600
    onTertiaryContainer: '#e9d5ff', // purple-200

    // States
    error: '#f87171', // red-400
    onError: '#7f1d1d', // red-900
    warning: '#fbbf24', // amber-400
    onWarning: '#78350f', // amber-900
    success: '#34d399', // emerald-400
    onSuccess: '#064e3b', // emerald-900

    // Borders
    border: '#475569', // slate-600
    borderVariant: '#64748b', // slate-500
    divider: '#374151', // gray-700
  },
};

// Earth tone themes
export const earthTheme: ThemeConfig = {
  theme: 'earth',
  colors: {
    // Warm earth backgrounds
    background: '#f7f3f0', // warm beige
    surface: '#ffffff',
    surfaceVariant: '#f0ebe5', // light clay

    // Rich earth text
    onBackground: '#3c2f26', // dark brown
    onSurface: '#5d4e42', // medium brown
    onSurfaceVariant: '#8a7968', // muted brown

    // Primary (terracotta)
    primary: '#c77d54', // terracotta
    onPrimary: '#ffffff',
    primaryContainer: '#f4e5d9', // light terracotta
    onPrimaryContainer: '#8b4513', // saddle brown

    // Secondary (sage green)
    secondary: '#8fbc8f', // dark sea green
    onSecondary: '#ffffff',
    secondaryContainer: '#e8f5e8', // light sage
    onSecondaryContainer: '#4a7c59', // forest green

    // Tertiary (warm gold)
    tertiary: '#d4af37', // gold
    onTertiary: '#3c2f26',
    tertiaryContainer: '#f5f0d6', // light gold
    onTertiaryContainer: '#b8860b', // dark goldenrod

    // States
    error: '#cd853f', // peru (earth-toned error)
    onError: '#ffffff',
    warning: '#daa520', // goldenrod
    onWarning: '#3c2f26',
    success: '#6b8e23', // olive drab
    onSuccess: '#ffffff',

    // Borders
    border: '#d2c7b8', // light tan
    borderVariant: '#c4b5a0', // darker tan
    divider: '#e8ddd4', // very light tan
  },
};

export const forestTheme: ThemeConfig = {
  theme: 'forest',
  colors: {
    // Deep forest backgrounds
    background: '#f0f4f0', // very light sage
    surface: '#ffffff',
    surfaceVariant: '#e8ede8', // light mint

    // Forest text
    onBackground: '#2d3a2d', // dark forest
    onSurface: '#3d4a3d', // medium forest
    onSurfaceVariant: '#5a6b5a', // muted forest

    // Primary (pine green)
    primary: '#4a7c59', // forest green
    onPrimary: '#ffffff',
    primaryContainer: '#d4e7d4', // light pine
    onPrimaryContainer: '#2e5233', // dark pine

    // Secondary (earth brown)
    secondary: '#8b6914', // dark goldenrod brown
    onSecondary: '#ffffff',
    secondaryContainer: '#f0e68c', // light earth
    onSecondaryContainer: '#654321', // dark chocolate

    // Tertiary (moss green)
    tertiary: '#9acd32', // yellow green
    onTertiary: '#2d3a2d',
    tertiaryContainer: '#f0ffff', // light moss
    onTertiaryContainer: '#556b2f', // dark olive green

    // States
    error: '#a0522d', // sienna
    onError: '#ffffff',
    warning: '#daa520', // goldenrod
    onWarning: '#2d3a2d',
    success: '#228b22', // forest green
    onSuccess: '#ffffff',

    // Borders
    border: '#c9d3c9', // light sage
    borderVariant: '#b8c5b8', // medium sage
    divider: '#e1ebe1', // very light sage
  },
};

export const desertTheme: ThemeConfig = {
  theme: 'desert',
  colors: {
    // Warm desert backgrounds
    background: '#faf7f2', // warm sand
    surface: '#ffffff',
    surfaceVariant: '#f5f0e8', // light sand

    // Desert text
    onBackground: '#4a3728', // dark sand
    onSurface: '#6b5b4a', // medium sand
    onSurfaceVariant: '#8b7d6b', // muted sand

    // Primary (sunset orange)
    primary: '#cd853f', // peru
    onPrimary: '#ffffff',
    primaryContainer: '#faebd7', // antique white
    onPrimaryContainer: '#8b4513', // saddle brown

    // Secondary (cactus green)
    secondary: '#8fbc8f', // dark sea green
    onSecondary: '#ffffff',
    secondaryContainer: '#f0fff0', // honeydew
    onSecondaryContainer: '#2e8b57', // sea green

    // Tertiary (desert rose)
    tertiary: '#bc8f8f', // rosy brown
    onTertiary: '#4a3728',
    tertiaryContainer: '#fff0f5', // lavender blush
    onTertiaryContainer: '#8b4513', // saddle brown

    // States
    error: '#a0522d', // sienna
    onError: '#ffffff',
    warning: '#daa520', // goldenrod
    onWarning: '#4a3728',
    success: '#9acd32', // yellow green
    onSuccess: '#4a3728',

    // Borders
    border: '#ddd6cc', // light tan
    borderVariant: '#d2bfaa', // tan
    divider: '#f0e8d8', // very light tan
  },
};

export const desertNightTheme: ThemeConfig = {
  theme: 'desert-night',
  colors: {
    // Dark desert backgrounds
    background: '#2a1f18', // dark sand
    surface: '#3d2e20', // darker sand
    surfaceVariant: '#4a3728', // medium sand

    // Desert dark text
    onBackground: '#f5f0e8', // light sand
    onSurface: '#e8ddd4', // warm light
    onSurfaceVariant: '#d2c7b8', // muted light

    // Primary (sunset glow)
    primary: '#ff8c42', // bright sunset orange
    onPrimary: '#2a1f18',
    primaryContainer: '#cd853f', // muted sunset
    onPrimaryContainer: '#faebd7', // light cream

    // Secondary (desert sage)
    secondary: '#a8cc8c', // desert sage
    onSecondary: '#2a1f18',
    secondaryContainer: '#5d7c47', // dark sage
    onSecondaryContainer: '#d4e5d4', // light sage

    // Tertiary (moonlit rose)
    tertiary: '#d4a5a5', // pale rose
    onTertiary: '#2a1f18',
    tertiaryContainer: '#8b6969', // muted rose
    onTertiaryContainer: '#f0d0d0', // light rose

    // States
    error: '#ff6b6b', // warm red
    onError: '#2a1f18',
    warning: '#ffcc5c', // warm yellow
    onWarning: '#2a1f18',
    success: '#81c784', // soft green
    onSuccess: '#2a1f18',

    // Borders
    border: '#5d4e42', // medium brown
    borderVariant: '#6b5b4a', // lighter brown
    divider: '#3d2e20', // dark surface
  },
};

export const oceanTheme: ThemeConfig = {
  theme: 'ocean',
  colors: {
    // Ocean backgrounds with aqua tones
    background: '#f0fdfa', // very light mint
    surface: '#ffffff',
    surfaceVariant: '#e6fffa', // light mint

    // Ocean text
    onBackground: '#134e4a', // deep teal
    onSurface: '#0f766e', // teal
    onSurfaceVariant: '#14b8a6', // medium teal

    // Primary (ocean teal)
    primary: '#06b6d4', // cyan-teal
    onPrimary: '#ffffff',
    primaryContainer: '#a7f3d0', // light sea green
    onPrimaryContainer: '#134e4a', // deep teal

    // Secondary (sea green)
    secondary: '#10b981', // emerald sea green
    onSecondary: '#ffffff',
    secondaryContainer: '#d1fae5', // light emerald
    onSecondaryContainer: '#065f46', // dark emerald

    // Tertiary (ocean blue)
    tertiary: '#0ea5e9', // sky blue
    onTertiary: '#ffffff',
    tertiaryContainer: '#bae6fd', // light blue
    onTertiaryContainer: '#0c4a6e', // deep blue

    // States
    error: '#f87171', // coral red
    onError: '#ffffff',
    warning: '#fbbf24', // golden amber
    onWarning: '#134e4a',
    success: '#34d399', // bright sea green
    onSuccess: '#134e4a',

    // Borders
    border: '#a7f3d0', // light sea green
    borderVariant: '#6ee7b7', // medium sea green
    divider: '#ecfdf5', // very light mint
  },
};

export const stoneTheme: ThemeConfig = {
  theme: 'stone',
  colors: {
    // Cool stone backgrounds
    background: '#f8f8f6', // warm white
    surface: '#ffffff',
    surfaceVariant: '#f0f0ee', // light stone

    // Stone text
    onBackground: '#36342e', // charcoal
    onSurface: '#504e47', // dark stone
    onSurfaceVariant: '#6e6c63', // medium stone

    // Primary (slate blue)
    primary: '#708090', // slate gray
    onPrimary: '#ffffff',
    primaryContainer: '#e8eaed', // light slate
    onPrimaryContainer: '#2f4f4f', // dark slate gray

    // Secondary (warm stone)
    secondary: '#a0826d', // light brown
    onSecondary: '#ffffff',
    secondaryContainer: '#f5f5dc', // beige
    onSecondaryContainer: '#654321', // dark brown

    // Tertiary (sage)
    tertiary: '#87ceeb', // sky blue (soft accent)
    onTertiary: '#36342e',
    tertiaryContainer: '#f0f8ff', // alice blue
    onTertiaryContainer: '#4682b4', // steel blue

    // States
    error: '#a0522d', // sienna
    onError: '#ffffff',
    warning: '#b8860b', // dark goldenrod
    onWarning: '#36342e',
    success: '#6b8e23', // olive drab
    onSuccess: '#ffffff',

    // Borders
    border: '#d6d4d0', // light stone
    borderVariant: '#c4c2bd', // medium stone
    divider: '#e8e6e3', // very light stone
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  earth: earthTheme,
  forest: forestTheme,
  desert: desertTheme,
  'desert-night': desertNightTheme,
  ocean: oceanTheme,
  stone: stoneTheme,
} as const;
