/**
 * Font Configuration
 *
 * Define font families and their combinations here.
 * Switch between different font schemes by changing the ACTIVE_FONT_SCHEME constant.
 *
 * DYNAMIC_FONT_SWITCHING: Enable/disable runtime font switching
 * - true: Users can switch fonts via UI without server restart
 * - false: Uses ACTIVE_FONT_SCHEME only (build-time, better performance)
 */

export const DYNAMIC_FONT_SWITCHING = true;

export type FontScheme = {
  name: string;
  description: string;
  fonts: {
    sans: {
      family: string;
      weights?: number[];
      subsets?: string[];
      variable?: string;
    };
    mono: {
      family: string;
      weights?: number[];
      subsets?: string[];
      variable?: string;
    };
    display?: {
      family: string;
      weights?: number[];
      subsets?: string[];
      variable?: string;
    };
  };
};

export const FONT_SCHEMES: Record<string, FontScheme> = {
  geist: {
    name: 'Geist',
    description: 'Modern, clean, and highly readable',
    fonts: {
      sans: { family: 'Geist', subsets: ['latin'], variable: '--font-geist-sans' },
      mono: { family: 'Geist Mono', subsets: ['latin'], variable: '--font-geist-mono' },
    },
  },

  inter: {
    name: 'Inter',
    description: 'Professional and versatile',
    fonts: {
      sans: { family: 'Inter', subsets: ['latin'], variable: '--font-inter' },
      mono: { family: 'JetBrains Mono', subsets: ['latin'], variable: '--font-jetbrains-mono' },
    },
  },

  plusJakarta: {
    name: 'Plus Jakarta Sans',
    description: 'Friendly modern geometric',
    fonts: {
      sans: { family: 'Plus Jakarta Sans', subsets: ['latin'], variable: '--font-plus-jakarta' },
      mono: { family: 'Fira Code', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-fira-code' },
    },
  },

  spaceGrotesk: {
    name: 'Space Grotesk',
    description: 'Bold and distinctive',
    fonts: {
      sans: { family: 'Space Grotesk', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-space-grotesk' },
      mono: { family: 'Space Mono', weights: [400, 700], subsets: ['latin'], variable: '--font-space-mono' },
    },
  },

  poppins: {
    name: 'Poppins',
    description: 'Geometric with excellent readability',
    fonts: {
      sans: { family: 'Poppins', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-poppins' },
      mono: { family: 'Source Code Pro', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-source-code' },
    },
  },

  dmSans: {
    name: 'DM Sans',
    description: 'Low-contrast, easy on the eyes',
    fonts: {
      sans: { family: 'DM Sans', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-dm-sans' },
      display: { family: 'DM Serif Display', weights: [400], subsets: ['latin'], variable: '--font-dm-serif' },
      mono: { family: 'IBM Plex Mono', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-ibm-plex-mono' },
    },
  },

  workSans: {
    name: 'Work Sans',
    description: 'Optimized for screen reading',
    fonts: {
      sans: { family: 'Work Sans', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-work-sans' },
      mono: { family: 'Roboto Mono', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-roboto-mono' },
    },
  },

  manrope: {
    name: 'Manrope',
    description: 'Modern geometric with open forms',
    fonts: {
      sans: { family: 'Manrope', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-manrope' },
      mono: { family: 'JetBrains Mono', subsets: ['latin'], variable: '--font-jetbrains-mono' },
    },
  },

  rubik: {
    name: 'Rubik',
    description: 'Rounded sans with personality',
    fonts: {
      sans: { family: 'Rubik', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-rubik' },
      mono: { family: 'Courier Prime', weights: [400, 700], subsets: ['latin'], variable: '--font-courier-prime' },
    },
  },

  nunito: {
    name: 'Nunito',
    description: 'Well-balanced rounded sans',
    fonts: {
      sans: { family: 'Nunito', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-nunito' },
      mono: { family: 'Fira Code', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-fira-code' },
    },
  },

  outfit: {
    name: 'Outfit',
    description: 'Clean geometric with good metrics',
    fonts: {
      sans: { family: 'Outfit', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-outfit' },
      mono: { family: 'IBM Plex Mono', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-ibm-plex-mono' },
    },
  },

  sora: {
    name: 'Sora',
    description: 'Geometric with unique character',
    fonts: {
      sans: { family: 'Sora', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-sora' },
      mono: { family: 'Red Hat Mono', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-red-hat-mono' },
    },
  },

  urbanist: {
    name: 'Urbanist',
    description: 'Elegant geometric sans',
    fonts: {
      sans: { family: 'Urbanist', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-urbanist' },
      mono: { family: 'Space Mono', weights: [400, 700], subsets: ['latin'], variable: '--font-space-mono' },
    },
  },

  lexend: {
    name: 'Lexend',
    description: 'Designed for reading accessibility',
    fonts: {
      sans: { family: 'Lexend', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-lexend' },
      mono: { family: 'Source Code Pro', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-source-code' },
    },
  },

  archivo: {
    name: 'Archivo',
    description: 'Grotesque with excellent legibility',
    fonts: {
      sans: { family: 'Archivo', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-archivo' },
      mono: { family: 'Inconsolata', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-inconsolata' },
    },
  },

  cabin: {
    name: 'Cabin',
    description: 'Humanist sans inspired by signage',
    fonts: {
      sans: { family: 'Cabin', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-cabin' },
      mono: { family: 'Fira Code', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-fira-code' },
    },
  },

  epilogue: {
    name: 'Epilogue',
    description: 'Versatile geometric sans',
    fonts: {
      sans: { family: 'Epilogue', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-epilogue' },
      mono: { family: 'JetBrains Mono', subsets: ['latin'], variable: '--font-jetbrains-mono' },
    },
  },

  figtree: {
    name: 'Figtree',
    description: 'Contemporary geometric',
    fonts: {
      sans: { family: 'Figtree', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-figtree' },
      mono: { family: 'IBM Plex Mono', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-ibm-plex-mono' },
    },
  },

  albert: {
    name: 'Albert Sans',
    description: 'Modern geometric with warmth',
    fonts: {
      sans: { family: 'Albert Sans', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-albert-sans' },
      mono: { family: 'Roboto Mono', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-roboto-mono' },
    },
  },

  satoshi: {
    name: 'Anybody',
    description: 'Variable width display font',
    fonts: {
      sans: { family: 'Anybody', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-anybody' },
      mono: { family: 'Red Hat Mono', weights: [400, 500, 600, 700], subsets: ['latin'], variable: '--font-red-hat-mono' },
    },
  },
};

/**
 * Active Font Scheme
 * Change this to switch between different font combinations
 */
export const ACTIVE_FONT_SCHEME: keyof typeof FONT_SCHEMES = 'inter';

// Available schemes:
// - geist (current) - Modern and clean
// - inter - Professional
// - plusJakarta - Friendly geometric
// - spaceGrotesk - Bold and distinctive
// - poppins - Excellent readability
// - dmSans - Includes display font for headings

/**
 * Get the currently active font scheme
 */
export function getActiveFontScheme(): FontScheme {
  return FONT_SCHEMES[ACTIVE_FONT_SCHEME];
}

/**
 * Get all available font schemes
 */
export function getAllFontSchemes(): FontScheme[] {
  return Object.values(FONT_SCHEMES);
}
