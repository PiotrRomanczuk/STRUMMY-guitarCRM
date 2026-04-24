/**
 * Font Loading and Management
 *
 * This module dynamically loads fonts based on the active font scheme.
 * It uses Next.js font optimization for performance.
 */

import {
  Geist,
  Geist_Mono,
  Inter,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Fira_Code,
  Space_Grotesk,
  Space_Mono,
  Poppins,
  Source_Code_Pro,
  DM_Sans,
  DM_Serif_Display,
  IBM_Plex_Mono,
  Work_Sans,
  Roboto_Mono,
  Manrope,
  Rubik,
  Courier_Prime,
  Nunito,
  Outfit,
  Sora,
  Red_Hat_Mono,
  Urbanist,
  Lexend,
  Archivo,
  Inconsolata,
  Cabin,
  Epilogue,
  Figtree,
  Albert_Sans,
  Anybody,
  Fraunces,
} from 'next/font/google';

import { ACTIVE_FONT_SCHEME, FONT_SCHEMES } from './fonts.config';

// Font instances
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'] });
const plusJakartaSans = Plus_Jakarta_Sans({ variable: '--font-plus-jakarta', subsets: ['latin'] });
const firaCode = Fira_Code({
  variable: '--font-fira-code',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  weight: ['400', '700'],
  subsets: ['latin'],
});
const poppins = Poppins({
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const sourceCodePro = Source_Code_Pro({
  variable: '--font-source-code',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const dmSerifDisplay = DM_Serif_Display({
  variable: '--font-dm-serif',
  weight: ['400'],
  subsets: ['latin'],
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const workSans = Work_Sans({
  variable: '--font-work-sans',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const manrope = Manrope({
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const rubik = Rubik({
  variable: '--font-rubik',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const courierPrime = Courier_Prime({
  variable: '--font-courier-prime',
  weight: ['400', '700'],
  subsets: ['latin'],
});
const nunito = Nunito({
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const outfit = Outfit({
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const sora = Sora({
  variable: '--font-sora',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const redHatMono = Red_Hat_Mono({
  variable: '--font-red-hat-mono',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const urbanist = Urbanist({
  variable: '--font-urbanist',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const lexend = Lexend({
  variable: '--font-lexend',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const archivo = Archivo({
  variable: '--font-archivo',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const inconsolata = Inconsolata({
  variable: '--font-inconsolata',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const cabin = Cabin({
  variable: '--font-cabin',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const epilogue = Epilogue({
  variable: '--font-epilogue',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const figtree = Figtree({
  variable: '--font-figtree',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const albertSans = Albert_Sans({
  variable: '--font-albert-sans',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
});
const anybody = Anybody({
  variable: '--font-anybody',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

// Font mapping
const fontMap = {
  Geist: geistSans,
  'Geist Mono': geistMono,
  Inter: inter,
  'JetBrains Mono': jetbrainsMono,
  'Plus Jakarta Sans': plusJakartaSans,
  'Fira Code': firaCode,
  'Space Grotesk': spaceGrotesk,
  'Space Mono': spaceMono,
  Poppins: poppins,
  'Source Code Pro': sourceCodePro,
  'DM Sans': dmSans,
  'DM Serif Display': dmSerifDisplay,
  'IBM Plex Mono': ibmPlexMono,
  'Work Sans': workSans,
  'Roboto Mono': robotoMono,
  Manrope: manrope,
  Rubik: rubik,
  'Courier Prime': courierPrime,
  Nunito: nunito,
  Outfit: outfit,
  Sora: sora,
  'Red Hat Mono': redHatMono,
  Urbanist: urbanist,
  Lexend: lexend,
  Archivo: archivo,
  Inconsolata: inconsolata,
  Cabin: cabin,
  Epilogue: epilogue,
  Figtree: figtree,
  'Albert Sans': albertSans,
  Anybody: anybody,
  Fraunces: fraunces,
};

/**
 * Get the active fonts based on the current font scheme
 */
export function getActiveFonts(schemeKey?: string) {
  const key = schemeKey || ACTIVE_FONT_SCHEME;
  const scheme = FONT_SCHEMES[key];

  return {
    sans: fontMap[scheme.fonts.sans.family as keyof typeof fontMap],
    mono: fontMap[scheme.fonts.mono.family as keyof typeof fontMap],
    display: scheme.fonts.display
      ? fontMap[scheme.fonts.display.family as keyof typeof fontMap]
      : undefined,
    scheme: key,
  };
}

/**
 * Get all font variable classes for a specific scheme
 */
export function getFontVariableClassesForScheme(schemeKey: string): string {
  const fonts = getActiveFonts(schemeKey);
  const classes = [fonts.sans.variable, fonts.mono.variable];
  if (fonts.display) classes.push(fonts.display.variable);
  return classes.join(' ');
}

/**
 * Get font variable class names for the body element (static)
 */
export function getFontVariableClasses(): string {
  return getFontVariableClassesForScheme(ACTIVE_FONT_SCHEME);
}

/**
 * Get all font classes (for dynamic switching - loads all fonts)
 */
export function getAllFontClasses(): string {
  const allClasses = Object.values(fontMap).map((font) => font.variable);
  return [...new Set(allClasses)].join(' ');
}
