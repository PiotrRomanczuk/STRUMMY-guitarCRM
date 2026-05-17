# Feature 9: Profile & Settings

> **Tier**: 2 | **Priority**: Supporting

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/profile` | User profile page |
| `/dashboard/settings` | Main settings page |
| `/dashboard/settings/notifications` | Notification preferences |

## Component Tree

### Profile (14 files)
| File | LOC | Purpose |
|------|-----|---------|
| `components/profile/ProfileForm.tsx` | ~120 | Main profile form |
| `components/profile/ProfileFormFields.tsx` | ~100 | Field definitions |
| `components/profile/ProfileComponents.tsx` | 120 | Reusable profile UI pieces |
| `components/profile/AccountDeletionDialog.tsx` | ~80 | Account deletion confirm |
| `components/profile/EmailChangeForm.tsx` | ~80 | Email change flow |
| `components/profile/LinkedAccounts.tsx` | ~60 | OAuth account links |
| `components/profile/MFASetup.tsx` | ~100 | MFA configuration |
| `components/profile/SessionInfo.tsx` | ~60 | Active sessions |
| `components/profile/useProfileData.ts` | ~60 | Profile data hook |

### Settings (22 files)
| File | LOC | Purpose |
|------|-----|---------|
| `components/settings/SettingsPageClient.tsx` | ~80 | Main settings wrapper |
| `components/settings/SettingsSections.tsx` | ~60 | Section layout |
| `components/settings/SettingsComponents.tsx` | 115 | Base components |
| `components/settings/useSettings.ts` | ~60 | Settings hook |
| `components/settings/FontSwitcher.tsx` | ~80 | Font selector |
| `components/settings/FontPreview.tsx` | ~60 | Font preview |
| `components/settings/ApiKeyManager.tsx` | ~100 | API key CRUD |
| `components/settings/ApiKeysSection.tsx` | ~60 | API keys section |
| `components/settings/DatabaseSection.tsx` | ~60 | DB connection info |
| `components/settings/IntegrationsSection.tsx` | ~80 | Third-party integrations |
| `components/settings/IntegrationItem.tsx` | ~40 | Integration card |
| `components/settings/SettingsLink.tsx` | ~20 | Navigation link |
| `components/settings/SettingsSection.tsx` | ~30 | Section wrapper |
| `components/settings/SettingsToggle.tsx` | ~30 | Toggle switch |
| `components/settings/SettingsFooter.tsx` | ~20 | Footer actions |

### Notification Preferences (4 files)
| File | LOC | Purpose |
|------|-----|---------|
| `components/settings/NotificationPreferences.tsx` | ~80 | Preferences form |
| `components/settings/NotificationPreferences.Item.tsx` | ~40 | Individual toggle |
| `components/settings/useNotificationPreferences.ts` | ~60 | Preferences hook |
| `components/settings/notification-preferences.helpers.ts` | ~30 | Helpers |

**Total**: ~36 files, ~2,280 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| `getUserSettings(userId)` | `app/actions/settings.ts` | UserSettings (theme, language, timezone) |
| `saveUserSettings(settings)` | `app/actions/settings.ts` | Updated settings |
| `getUserNotificationPreferences(userId)` | `app/actions/notification-preferences.ts` | NotificationPreference[] |
| `updateNotificationPreference(userId, type, enabled)` | `app/actions/notification-preferences.ts` | Updated preference |
| `updateAllNotificationPreferences(userId, enabled)` | `app/actions/notification-preferences.ts` | Bulk update count |

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useProfileData` | `components/profile/useProfileData.ts` | Server action |
| `useSettings` | `components/settings/useSettings.ts` | Server action |
| `useNotificationPreferences` | `components/settings/useNotificationPreferences.ts` | Server action |

## User Stories

### Teacher (on phone)
1. Update profile photo and bio — presented to students
2. Toggle notification preferences — turn off email reminders, keep in-app
3. Connect/disconnect Google Calendar integration

### Student (on phone)
1. Update name and contact info
2. Change notification preferences
3. View linked accounts

## Mobile Pain Points (at 390px)

1. **Settings page is a long scroll** — no grouping or section navigation
2. **API key display** — long keys overflow, hard to copy on mobile
3. **Toggle switches** — may be too close together, accidental taps
4. **MFA setup** — QR code display and code input need careful layout
5. **Font preview** — preview area too small to see differences
6. **No quick-access** — frequently used settings buried deep

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/settings/Settings.tsx` | Grouped settings with section navigation |
| `components/v2/settings/Settings.Desktop.tsx` | Desktop two-column layout |
| `components/v2/profile/Profile.tsx` | Mobile-optimized profile editor |
| `components/v2/profile/Profile.Desktop.tsx` | Desktop profile layout |
| `components/v2/settings/UIVersionToggle.tsx` | **v1/v2 UI toggle** for the transition |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/settings/SettingsPageClient.tsx` | Replaced by v2 grouped settings |
| `components/profile/ProfileForm.tsx` | Replaced by v2 profile |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [ ] `GroupedSettingsList` — iOS-style grouped settings sections
- [ ] `CopyableField` — tap-to-copy for API keys
