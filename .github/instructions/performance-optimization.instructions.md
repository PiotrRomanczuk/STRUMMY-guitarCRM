# Performance & Mobile Optimization

**Status**: Established via discovery Q&A (Q22, Q13)  
**Last Updated**: October 26, 2025  
**Enforced By**: Lighthouse audits, performance monitoring

---

## Purpose

Ensure Guitar CRM performs well on mobile networks and maintains Core Web Vitals targets. Teachers using on 4G/5G during lessons, students on home WiFi.

---

## Core Metrics & Targets

| Metric                             | Target  | Why                                 |
| ---------------------------------- | ------- | ----------------------------------- |
| **LCP** (Largest Contentful Paint) | < 2.5s  | First meaningful content visible    |
| **FID** (First Input Delay)        | < 100ms | Responsiveness on first interaction |
| **CLS** (Cumulative Layout Shift)  | < 0.1   | Visual stability                    |
| **Mobile Speed Index**             | < 4s    | Perceived speed                     |
| **Lighthouse Score**               | > 85    | Overall quality                     |

**Current status**: Check with `npm run lighthouse-audit`

---

## Image Optimization

### Use Next.js Image Component

```tsx
// ❌ DON'T: HTML img tag (no optimization)
<img src='/lesson-cover.jpg' alt='Lesson' />;

// ✅ DO: Next.js Image component
import Image from 'next/image';

<Image
	src='/lesson-cover.jpg'
	alt='Lesson cover'
	width={400}
	height={300}
	priority // Only for above-the-fold images
	loading='lazy' // For below-the-fold
/>;
```

### Image Best Practices

```tsx
// ✅ Always set width/height (prevents layout shift)
<Image src="/song.png" alt="Song" width={100} height={100} />

// ✅ Use priority for hero images
<Image src="/hero.png" alt="Hero" priority width={800} height={400} />

// ✅ Use loading="lazy" for non-critical images
<Image src="/thumbnail.png" alt="Thumbnail" loading="lazy" />

// ✅ Optimize images before uploading
// Use tools like TinyPNG, ImageOptim, or Squoosh
// Target: < 100KB for thumbnails, < 500KB for full-width

// ✅ Use WebP format when possible
// Next.js automatically serves best format
```

---

## Code Splitting & Bundling

### Dynamic Imports for Large Components

```tsx
// ❌ DON'T: Import everything at top
import { HeavyChart } from '@/components/HeavyChart';

function Dashboard() {
	return <HeavyChart />;
}

// ✅ DO: Lazy load non-critical components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
	loading: () => <Skeleton />,
	ssr: false, // Don't render on server if not needed
});

function Dashboard() {
	return <HeavyChart />;
}
```

### Route-Based Code Splitting (Automatic)

Next.js automatically splits code per route:

```
page.tsx    → chunk-page.js (route-specific)
layout.tsx  → chunk-layout.js (shared across routes)
component   → chunk-component.js (used in multiple routes)
```

**Keep shared code small**:

```
❌ Large shared component: 500KB
✅ Smaller shared utilities: 50KB
```

---

## JavaScript Optimization

### Minimize Hydration

```tsx
// ❌ Server Component if possible
// Only use 'use client' when necessary
'use client'; // Adds JS to bundle

export function StudentList() {
	// ...
}

// ✅ Keep as Server Component
// app/students/page.tsx (automatically Server Component)
export default async function StudentListPage() {
	const students = await fetchStudents();
	return <StudentList students={students} />;
}
```

### Remove Unused Dependencies

```bash
# Find unused packages
npm ls --depth=0

# Analyze bundle size
npm run build && npm run analyze
```

---

## CSS Optimization

### Tailwind CSS (Already Configured)

Tailwind automatically:

- ✅ Removes unused styles
- ✅ Minifies CSS
- ✅ Purges unused classes

**Keep CSS small by**:

```tsx
// ✅ Use utility classes (already optimized)
className="px-3 py-2 bg-blue-500 hover:bg-blue-600"

// ❌ Don't add custom CSS
<style>{`
  .my-button { padding: 8px 12px; background: blue; }
`}</style>
```

---

## Network Optimization

### Reduce Payload Sizes

```typescript
// ❌ Fetching too much data
const { data } = await supabase.from('lessons').select('*'); // All columns (could be 50+ fields)

// ✅ Select only needed columns
const { data } = await supabase
	.from('lessons')
	.select('id, title, created_at, student_id');
```

### Pagination & Limiting

```typescript
// ❌ Fetching thousands of rows
const { data } = await supabase.from('lessons').select('*'); // Could return 10,000 rows!

// ✅ Paginate results
const { data } = await supabase
	.from('lessons')
	.select('id, title, created_at')
	.range(0, 24) // First 25 items
	.order('created_at', { ascending: false });
```

### Compression

Next.js automatically enables:

- ✅ Gzip compression
- ✅ Brotli compression (if supported)
- ✅ Static optimization

---

## Caching Strategies

### Browser Caching Headers

```typescript
// next.config.ts
const config: NextConfig = {
	headers: async () => {
		return [
			{
				source: '/images/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000' }, // 1 year
				],
			},
			{
				source: '/api/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'no-cache' }, // Always revalidate
				],
			},
		];
	},
};
```

### Server-Side Caching

```typescript
// Revalidate lessons every 5 minutes
export const revalidate = 300; // seconds

export default async function LessonsPage() {
	const lessons = await fetchLessons();
	return <LessonList lessons={lessons} />;
}
```

---

## Mobile Performance

### Touch-Friendly Sizing

```tsx
// ✅ Min 44x44px tap targets on mobile
<button className="px-3 sm:px-4 py-2 sm:py-3">
  {/* Min height: 32px base, 40px on mobile with padding */}
  Click me
</button>

// ❌ Too small on mobile
<button className="px-1 py-0">Click</button>
```

### Viewport Optimization

```tsx
// app/layout.tsx
export default function RootLayout() {
	return (
		<html>
			<head>
				<meta name='viewport' content='width=device-width, initial-scale=1' />
			</head>
			<body>{/* ... */}</body>
		</html>
	);
}
```

### Avoiding Layout Shift on Mobile

```tsx
// ✅ Reserve space for dynamically loaded content
<div className='w-full h-12'>
	{/* Component with guaranteed height */}
	<Skeleton />
</div>;

// ❌ Dynamic height causes shift
{
	isLoading && <Skeleton />;
}
{
	!isLoading && <List items={items} />;
}
```

---

## Monitoring & Debugging

### Lighthouse Audits

```bash
# Run Lighthouse audit
npm run lighthouse-audit

# Check specific URL
npm run lighthouse-audit -- https://strummy.vercel.app

# Results in lighthouse-reports/
```

### Web Vitals Monitoring

```typescript
// app/layout.tsx
import { reportWebVitals } from 'next/vitals';

export function reportWebVitals(metric) {
	console.log(metric);
	// Send to analytics service (Sentry, etc.)
	if (metric.value > metric.rating === 'poor') {
		Sentry.captureMessage(`Web Vital: ${metric.name} = ${metric.value}`);
	}
}
```

### Chrome DevTools Performance

1. Open DevTools → Performance tab
2. Start recording
3. Interact with page
4. Stop and analyze

**Look for**:

- Long tasks > 50ms
- Layout thrashing
- Unnecessary re-renders

---

## Common Mistakes & Fixes

### ❌ Mistake 1: Unoptimized Images

```tsx
// Before: 2MB JPG image
<img src="/lesson.jpg" alt="Lesson" />

// After: Optimized + Next.js Image
<Image src="/lesson.jpg" alt="Lesson" width={400} height={300} />
// Result: 150KB WebP
```

### ❌ Mistake 2: No Code Splitting

```tsx
// Before: 800KB main.js (all components)
import { HeavyChart } from '@/components/HeavyChart'; // 200KB
import { HeavyEditor } from '@/components/HeavyEditor'; // 300KB

// After: Lazy load non-critical
const HeavyChart = dynamic(() => import('@/components/HeavyChart'));
// Result: main.js = 300KB, HeavyChart loaded on demand
```

### ❌ Mistake 3: Fetching All Data

```typescript
// Before: 5000 lessons loaded
const { data } = await supabase.from('lessons').select('*');

// After: Paginated
const { data } = await supabase
	.from('lessons')
	.select('id, title, created_at')
	.range(0, 49)
	.order('created_at', { ascending: false });
// Result: 50 items, 20KB vs 2MB
```

### ❌ Mistake 4: Client-Side Computation

```tsx
// Before: Filter/sort on client (blocks rendering)
const lessons = allLessons // 10,000 items
	.filter((l) => l.studentId === studentId)
	.sort((a, b) => b.date - a.date);

// After: Filter on server
const { data: lessons } = await supabase
	.from('lessons')
	.select('*')
	.eq('student_id', studentId)
	.order('created_at', { ascending: false });
// Result: Only 50 items sent, not 10,000
```

---

## Performance Checklist

Before deploying:

- [ ] Lighthouse score > 85
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Images optimized and using Next.js Image
- [ ] No unused packages (`npm ls`)
- [ ] Code splitting for large components
- [ ] API queries select only needed columns
- [ ] Results paginated (not fetching all rows)
- [ ] Mobile tested at 3G throttle
- [ ] Tap targets >= 44px on mobile
- [ ] No console.log in production
- [ ] Caching headers set appropriately

---

## Monitoring in Production

### Set Up Sentry Performance Monitoring

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	tracesSampleRate: 0.1,
});
```

### Track Custom Performance Metrics

```typescript
const span = Sentry.startTransaction({
	name: 'Load Lessons',
	op: 'lessons.fetch',
});

// Your code

span.finish();
```

---

## Resources

- Core Web Vitals: https://web.dev/vitals/
- Next.js Image: https://nextjs.org/docs/app/api-reference/components/image
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- Web Perf Best Practices: https://web.dev/performance/
- Sentry Performance: https://docs.sentry.io/platforms/javascript/performance/
