# Feature 3: Songs

> **Tier**: 1 | **Priority**: Core Daily Use

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/songs` | Song library / list |
| `/dashboard/songs/new` | Create new song |
| `/dashboard/songs/[id]` | Song detail page |
| `/dashboard/songs/[id]/edit` | Edit song |

## Component Tree

### List
| File | LOC | Purpose |
|------|-----|---------|
| `components/songs/list/Client.tsx` | ~60 | Client wrapper |
| `components/songs/list/Header.tsx` | ~80 | List header + create button |
| `components/songs/list/Filter.tsx` | ~100 | Filter controls |
| `components/songs/list/FilterSelect.tsx` | ~60 | Filter dropdown |
| `components/songs/list/Table.tsx` | ~150 | Conditional mobile card / desktop table |
| `components/songs/list/Table.SongRow.tsx` | ~120 | SongMobileCard + SongDesktopRow |
| `components/songs/list/Table.HoverStatsCard.tsx` | ~80 | Desktop hover stats |
| `components/songs/list/Table.SortableHeader.tsx` | ~40 | Sortable columns |
| `components/songs/list/Empty.tsx` | ~30 | Empty state |
| `components/songs/list/BulkActionBar.tsx` | ~60 | Bulk operations |
| `components/songs/list/BulkDeleteDialog.tsx` | ~40 | Bulk delete confirm |
| `components/songs/list/SongSelectionDrawer.tsx` | ~80 | Song picker drawer |
| `components/songs/list/QuickAssignDialog.tsx` | ~60 | Quick assign to lesson |
| `components/songs/list/SyncSpotifyButton.tsx` | ~40 | Spotify sync |
| `components/songs/list/StatusSelect.tsx` | ~40 | Status filter |

### Form (MOBILE REFERENCE PATTERN)
| File | LOC | Purpose |
|------|-----|---------|
| `components/songs/form/index.tsx` | ~30 | Entry point |
| `components/songs/form/Content.tsx` | ~60 | Renders MobileSongForm on mobile |
| `components/songs/form/MobileSongForm.tsx` | 322 | **3-step mobile form (REFERENCE)** |
| `components/songs/form/ProgressIndicator.tsx` | ~40 | Step progress display |
| `components/songs/form/Fields.tsx` | ~150 | Form field definitions |
| `components/songs/form/FieldSelect.tsx` | ~40 | Select field wrapper |
| `components/songs/form/FieldText.tsx` | ~40 | Text field wrapper |
| `components/songs/form/FieldGroup.tsx` | ~30 | Field group layout |
| `components/songs/form/CategoryCombobox.tsx` | ~80 | Category picker |
| `components/songs/form/SpotifySearch.tsx` | ~100 | Spotify song search |
| `components/songs/form/SongNotesAI.tsx` | ~60 | AI note generation |
| `components/songs/form/SongFormGuard.tsx` | ~40 | Auth guard |
| `components/songs/form/useSongMutation.ts` | ~80 | Create/update mutation |

### Detail
| File | LOC | Purpose |
|------|-----|---------|
| `components/songs/details/index.tsx` | ~30 | Entry point |
| `components/songs/details/Header.tsx` | ~80 | Detail header |
| `components/songs/details/Info.tsx` | ~100 | Song metadata grid |
| `components/songs/details/Actions.tsx` | ~60 | Action buttons |
| `components/songs/details/ImageGallery.tsx` | ~80 | Image display |
| `components/songs/details/SongAssignments.tsx` | ~60 | Related assignments |
| `components/songs/details/SongLessons.tsx` | ~60 | Lessons using song |
| `components/songs/details/SongSections.tsx` | ~80 | Song structure sections |
| `components/songs/details/SongStudents.tsx` | ~60 | Students learning song |
| `components/songs/details/LyricsWithChords.tsx` | ~120 | Chord/lyric display |
| `components/songs/details/YouTubeEmbed.tsx` | ~40 | YouTube player |
| `components/songs/details/SyncSpotifyButton.tsx` | ~40 | Spotify sync |
| `components/songs/details/SpotifyMatchDialog.tsx` | ~80 | Match approval |
| `components/songs/details/useSongDetail.ts` | ~60 | Detail data hook |

### Student Song View
| File | LOC | Purpose |
|------|-----|---------|
| `components/songs/student/StudentSongsPageClient.tsx` | ~120 | Student song list |
| `components/songs/student/StudentSongDetailPageClient.tsx` | ~150 | Student song detail |
| `components/songs/student/StudentSongDetail.Header.tsx` | ~60 | Detail header |
| `components/songs/student/StudentSongDetail.InfoGrid.tsx` | ~80 | Info grid |
| `components/songs/student/StudentSongDetail.Lessons.tsx` | ~60 | Related lessons |
| `components/songs/student/StudentSongDetail.Resources.tsx` | ~60 | Resources section |
| `components/songs/student/StudentSongCard.tsx` | ~80 | Song card |
| `components/songs/student/StudentSongFilterControls.tsx` | ~60 | Filter controls |
| `components/songs/student/SongLibrary.tsx` | ~100 | Library browser |
| `components/songs/student/useStudentSongs.ts` | ~60 | Student songs hook |

### Videos
| File | LOC | Purpose |
|------|-----|---------|
| `components/songs/videos/VideoGallery.tsx` | ~80 | Video gallery |
| `components/songs/videos/VideoPlayer.tsx` | ~60 | Video player |
| `components/songs/videos/VideoCard.tsx` | ~40 | Video thumbnail card |
| `components/songs/videos/VideoUpload.tsx` | ~80 | Upload interface |
| `components/songs/videos/hooks/useVideoUpload.ts` | ~60 | Upload hook |

### Stats & Analysis
| File | LOC | Purpose |
|------|-----|---------|
| `components/songs/stats/SongStatsPage.tsx` | ~100 | Stats overview |
| `components/songs/stats/SongStatsKPIs.tsx` | ~80 | KPI cards |
| `components/songs/chord-analysis/ChordAnalysisPage.tsx` | ~120 | Chord analysis |
| `components/songs/chord-analysis/ChordFrequencyChart.tsx` | ~80 | Frequency chart |
| `components/songs/chord-analysis/TransitionHeatmap.tsx` | ~100 | Chord transitions |
| `components/songs/strumming/StrummingPatternDisplay.tsx` | ~60 | Strumming display |
| `components/songs/strumming/StrummingPatternEditor.tsx` | ~80 | Strumming editor |

### Requests
| File | LOC | Purpose |
|------|-----|---------|
| `components/songs/requests/SongRequestButton.tsx` | ~30 | Request trigger |
| `components/songs/requests/SongRequestDialog.tsx` | ~80 | Request form |
| `components/songs/requests/SongRequestList.tsx` | ~60 | Request list |
| `components/songs/requests/SongRequestQueue.tsx` | ~80 | Queue management |
| `components/songs/requests/SongRequestQueue.Item.tsx` | ~60 | Queue item |

**Total**: ~108 files, ~13,120 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| `updateLessonSongStatus()` | `app/actions/songs.ts` | Updated status |
| `getExistingCategories()` | `app/actions/songs.ts` | CategoryWithCount[] |
| `quickAssignSongToLesson()` | `app/actions/songs.ts` | Upserted record |

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useSongList` | `components/songs/hooks/useSongList.ts` | `/api/song` with role-based filtering |
| `useSong` | `components/songs/hooks/useSong.ts` | `/api/song/[id]` |
| `useSongDetail` | `components/songs/details/useSongDetail.ts` | `/api/song/[id]` detailed |
| `useSongMutation` | `components/songs/form/useSongMutation.ts` | POST/PUT `/api/song` |
| `useChordAnalysis` | `components/songs/hooks/useChordAnalysis.ts` | `/api/song/analysis` |
| `useSongStatsAdvanced` | `components/songs/hooks/useSongStatsAdvanced.ts` | `/api/song/stats` |
| `useStudentSongs` | `components/songs/student/useStudentSongs.ts` | `/api/song?student=true` |
| `useSongSelection` | `components/songs/list/useSongSelection.ts` | Client-side selection state |
| `useSongDelete` | `components/songs/list/useSongDelete.ts` | DELETE `/api/song/[id]` |
| `useVideoUpload` | `components/songs/videos/hooks/useVideoUpload.ts` | `/api/song/[id]/videos` |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/song` | GET, POST | List/create songs |
| `/api/song/[id]` | GET, PUT, DELETE | CRUD single song |
| `/api/song/[id]/videos` | GET, POST, DELETE | Video management |
| `/api/spotify/search` | GET | Spotify song search |
| `/api/spotify/sync` | POST | Sync song with Spotify |

## User Stories

### Teacher (on phone between lessons)
1. Quickly search for a song to assign to a student's upcoming lesson
2. Add a new song with Spotify search -- title, key, and chords auto-filled
3. Review a song's detail -- which students are learning it, in which lessons

### Student (practicing at home)
1. Browse assigned songs, tap to see chords, lyrics, and YouTube video
2. Watch instructional video for a song while practicing
3. Request a new song from teacher via the song request form

## Mobile Pain Points (at 390px)

1. **Song list already has SongMobileCard** -- decent but filter bar takes too much space
2. **Song detail page info grid** -- metadata displayed in multi-column grid that wraps poorly
3. **Lyrics with chords** -- chord annotations overlap on narrow screens, font too small
4. **Video player** -- YouTube embed doesn't resize well, controls small
5. **Spotify search** -- search results list cramped, album art too small to identify songs
6. **Strumming pattern editor** -- touch interaction needs larger targets

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/songs/SongList.tsx` | Enhanced mobile card list with filter chips |
| `components/v2/songs/SongList.Desktop.tsx` | Desktop table view |
| `components/v2/songs/SongDetail.tsx` | Mobile-optimized detail with tabs |
| `components/v2/songs/SongDetail.Desktop.tsx` | Desktop side-panel detail |
| `components/v2/songs/SongForm.tsx` | Generalized from MobileSongForm |
| `components/v2/songs/LyricsViewer.tsx` | Mobile-optimized chord/lyric display |
| `components/v2/songs/VideoPlayer.tsx` | Responsive video with controls |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/songs/list/Table.tsx` | Replaced by v2 SongList |
| `components/songs/details/Info.tsx` | Replaced by v2 SongDetail tabs |
| `components/songs/details/LyricsWithChords.tsx` | Replaced by v2 LyricsViewer |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `CollapsibleFilterBar` -- filter chips (category, difficulty, key)
- [x] `SwipeableListItem` -- swipe to assign/delete songs
- [x] `BottomActionSheet` -- song actions (edit, assign, delete)
- [ ] `ResponsiveVideoPlayer` -- YouTube embed wrapper
