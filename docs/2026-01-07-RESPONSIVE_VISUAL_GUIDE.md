# Quick Visual Layout Reference

## 🖥️ Ultrawide (3440x1440) Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Welcome Header - Full Width                                                │
│  "Welcome back, Admin"                                                      │
├──────────────────────────────────────┬──────────────────────────────────────┤
│                                      │                                      │
│  Lesson Statistics Overview          │  Today's Agenda                     │
│  (75% width - 3/4 cols)              │  (25% width - 1/4 cols)             │
│                                      │                                      │
├──────────────┬───────────────┬───────┴──────────────────────────────────────┤
│              │               │                                              │
│ Needs        │ Weekly        │  Health Summary                             │
│ Attention    │ Summary       │  (each 1/3 width on ultrawide = 2/6 cols)   │
│ (2/6 cols)   │ (2/6 cols)    │                                              │
│              │               │                                              │
├──────────────┴───────────────┴──────────────────────────────────────────────┤
│  Student Pipeline - Full Width                                              │
├────────────────────────────────────────────┬─────────────────────────────────┤
│                                            │                                 │
│  Student List + Song Library               │  Recent Activity                │
│  (60% width - 3/5 cols)                    │  + Assignments                  │
│                                            │  (40% width - 2/5 cols)         │
│                                            │                                 │
├────────────────────────────────────────────┴─────────────────────────────────┤
│  Progress Chart - Full Width                                                │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────────────┤
│Total │Teach │Stud  │Songs │Less  │ (10 columns - each stat spans 2)        │
│Users │ers   │ents  │      │ons   │                                         │
│(2col)│(2col)│(2col)│(2col)│(2col)│                                         │
└──────┴──────┴──────┴──────┴──────┴──────────────────────────────────────────┘
```

## 📱 Portrait 1080p Layout

```
┌──────────────────┐
│   Welcome Header │
│                  │
├──────────────────┤
│ Lesson Statistics│
│   Overview       │
│  (Full width)    │
│                  │
├──────────────────┤
│  Today's Agenda  │
│  (Full width)    │
│                  │
├──────────────────┤
│ Needs Attention  │
│  (Full width)    │
│                  │
├──────────────────┤
│ Weekly Summary   │
│  (Full width)    │
│                  │
├──────────────────┤
│  Health Summary  │
│  (Full width)    │
│                  │
├──────────────────┤
│Student Pipeline  │
│  (Full width)    │
│                  │
├──────────────────┤
│  Student List    │
│  (Full width)    │
│                  │
├──────────────────┤
│  Song Library    │
│  (Full width)    │
│                  │
├──────────────────┤
│Recent Activity   │
│  (Full width)    │
│                  │
├──────────────────┤
│  Assignments     │
│  (Full width)    │
│                  │
├──────────────────┤
│Progress Chart    │
│  (Full width)    │
│                  │
├────────┬─────────┤
│ Total  │Teachers │
│ Users  │         │
├────────┼─────────┤
│Students│ Songs   │
│        │         │
├────────┼─────────┤
│Lessons │         │
│        │         │
└────────┴─────────┘
```

## 📱 iPhone 17 Pro Max Layout

```
┌─────────┐
│ Welcome │
│ Header  │
│(compact)│
├─────────┤
│ Lesson  │
│  Stats  │
│(2 cols) │
├─────────┤
│ Today's │
│ Agenda  │
│(compact)│
├─────────┤
│ Needs   │
│ Attn    │
│(compact)│
├─────────┤
│ Weekly  │
│Summary  │
│(3 mini  │
│ boxes)  │
├─────────┤
│ Health  │
│Summary  │
│(compact)│
├─────────┤
│Student  │
│Pipeline │
│(scroll) │
├─────────┤
│ Student │
│  List   │
│ (stack) │
├─────────┤
│  Song   │
│ Library │
│ (stack) │
├─────────┤
│ Recent  │
│Activity │
│ (stack) │
├─────────┤
│Assignmt │
│  List   │
│ (stack) │
├─────────┤
│Progress │
│ Chart   │
│(adapted)│
├────┬────┤
│Tot │Tea │
│Usr │cher│
├────┼────┤
│Stu │Sng │
│dnt │    │
├────┼────┤
│Les │    │
│son │    │
└────┴────┘
```

## 🎨 Responsive Features by Display

### Ultrawide (3440x1440)
- ✅ 10-column grid system
- ✅ Maximum horizontal space usage
- ✅ Side-by-side layouts
- ✅ Larger fonts and spacing
- ✅ 6-column quick stats
- ✅ 5-column content area

### Portrait 1080p
- ✅ Single-column vertical stack
- ✅ Full-width components
- ✅ 2-column for small stats
- ✅ Optimized for scrolling
- ✅ No wasted horizontal space

### iPhone 17 Pro Max
- ✅ Single-column mobile layout
- ✅ Compact padding (3px base)
- ✅ Smaller fonts (text-xs → sm)
- ✅ Touch-friendly (44px targets)
- ✅ 2-column for tiny stats only
- ✅ Collapsible/expandable sections

## 📏 Breakpoint Reference

```css
/* Mobile First */
Base:      0px    - 100% (iPhone, small phones)
xs:        475px  - Small phones landscape
sm:        640px  - Phones landscape, small tablets
md:        768px  - Tablets portrait
lg:        1024px - Tablets landscape, small laptops
xl:        1280px - Laptops
2xl:       1536px - Large laptops, desktops

/* Custom */
portrait:  1080px - Vertical 1080p (with orientation: portrait)
ultrawide: 2560px - Ultrawide monitors (3440x1440, 2560x1080, etc.)
```

## 🚀 Performance Tips

1. **Lazy load** components below fold on mobile
2. **Reduce animations** on ultrawide for performance
3. **Optimize images** for each breakpoint
4. **Use CSS containment** for isolated components
5. **Minimize re-renders** with React.memo where appropriate

## 🧪 Testing Checklist

- [ ] Test on actual 3440x1440 monitor
- [ ] Test on 1080p vertical display (rotate monitor)
- [ ] Test on iPhone 17 Pro Max (or similar device)
- [ ] Verify all grids adapt correctly
- [ ] Check font sizes are readable
- [ ] Ensure touch targets are 44x44px minimum
- [ ] Test scrolling performance
- [ ] Verify animations work smoothly
- [ ] Check dark mode on all displays
- [ ] Test landscape/portrait orientation changes
