# Feature Documentation

This document provides detailed information about the key features implemented in muse.log.

## Table of Contents

- [Category Filtering Pages](#category-filtering-pages)
- [Table of Contents](#table-of-contents-component)
- [Breadcrumb Navigation](#breadcrumb-navigation)
- [3-Column Layout](#3-column-layout)
- [Custom Hooks](#custom-hooks)

---

## Category Filtering Pages

**Route**: `/category/[slug]`

**File**: `src/app/category/[slug]/page.tsx`

### Description

Displays all posts belonging to a specific category and its descendants (child and grandchild categories). Uses Incremental Static Regeneration (ISR) for optimal performance.

### Features

- **Hierarchical filtering**: Shows posts from selected category and all subcategories
- **Static generation**: Pre-renders all category pages at build time
- **ISR**: Revalidates every hour (3600 seconds)
- **SEO optimized**: Dynamic metadata generation
- **Empty state**: Graceful handling when no posts exist

### Implementation Details

```typescript
// Static generation at build time
export async function generateStaticParams() {
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .order('level', { ascending: true });

  return categories.map((cat) => ({ slug: cat.slug }));
}

// ISR with 1-hour revalidation
export const revalidate = 3600;
```

### Query Strategy

Uses `getDescendantCategoryIds()` utility to find all child categories:

```typescript
const categoryIds = getDescendantCategoryIds(category.id, categoryMap);

const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .in('category_id', categoryIds)
  .eq('published', true)
  .order('created_at', { ascending: false });
```

### Right Sidebar

Displays `CategoryInfo` component with:
- Category description
- Post count
- List of direct subcategories (clickable links)

---

## Table of Contents Component

**File**: `src/components/TableOfContents.tsx`

### Description

Automatically generates a navigable table of contents from markdown content with scroll spy functionality.

### Features

- **Auto-extraction**: Parses H2 and H3 headings from markdown
- **Scroll spy**: Highlights the currently visible section
- **Smooth scrolling**: Animated navigation to sections
- **Collapsible**: Toggle visibility with state persisted in localStorage
- **Responsive**: Hidden on mobile, visible on large screens

### Implementation

**Heading Extraction**:

```typescript
const headingRegex = /^(#{2,3})\s+(.+)$/gm;
const matches = Array.from(content.matchAll(headingRegex));

const items = matches.map((match) => ({
  id: match[2]
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-'),
  text: match[2],
  level: match[1].length as 2 | 3,
}));
```

**Scroll Spy**:

Uses custom `useScrollSpy` hook with IntersectionObserver:

```typescript
const activeId = useScrollSpy(items.map((item) => item.id));
```

### Styling

- Level 2 headings: No indentation
- Level 3 headings: Indented with `pl-3`
- Active item: Blue color with border
- Hover state: Color transition

### localStorage Key

`toc-collapsed` - Stores boolean collapse state

---

## Breadcrumb Navigation

**File**: `src/components/Breadcrumb.tsx`

### Description

Displays hierarchical navigation path showing category ancestry.

### Features

- **Hierarchical path**: Shows full category ancestry (Home > IT > Backend > Node.js)
- **Clickable segments**: All parent categories are links
- **Current page**: Displayed without link
- **Accessible**: ARIA labels for screen readers
- **Separator**: Visual › character between segments

### Data Structure

```typescript
interface BreadcrumbSegment {
  name: string;
  href?: string; // undefined for current page
}
```

### Example Usage

```typescript
const segments: BreadcrumbSegment[] = [
  { name: 'Home', href: '/' },
  { name: 'IT', href: '/category/it' },
  { name: 'Backend', href: '/category/backend' },
  { name: 'Node.js' }, // Current page (no href)
];
```

### Implementation

Built using utility functions:
- `getCategoryPath()`: Generates "Parent > Child" string
- `getCategorySlugByName()`: Maps category name to slug for URLs

---

## 3-Column Layout

### Structure

```
┌──────────────┬───────────────────────┬──────────────┐
│   Sidebar    │    Main Content       │  Right Panel │
│  (Category   │    (55% width)        │   (TOC or    │
│    Tree)     │                       │ Category Info)│
│  Collapsible │  Post/Category List   │  Collapsible │
└──────────────┴───────────────────────┴──────────────┘
```

### Responsive Behavior

- **Mobile (< 1024px)**: Single column, sidebars hidden
- **Desktop (≥ 1024px)**: Full 3-column layout

### Width Distribution

- Left Sidebar: `w-1/4` (25%)
- Main Content: `w-full lg:w-[55%]` (55% on large screens)
- Right Sidebar: `w-1/4` (25%)

### Sticky Positioning

Both sidebars use `sticky top-4` for scroll behavior:

```typescript
<div className="sticky top-4">
  {/* Sidebar content */}
</div>
```

### Components Used

**Post Page**:
- Left: `Sidebar` (category tree)
- Center: Post content with ReactMarkdown
- Right: `TableOfContents`

**Category Page**:
- Left: `Sidebar` (category tree)
- Center: `PostCard` list or `EmptyState`
- Right: `CategoryInfo`

---

## Custom Hooks

### useScrollSpy

**File**: `src/hooks/useScrollSpy.ts`

**Purpose**: Tracks which heading is currently visible in the viewport.

**Parameters**:
- `headingIds: string[]` - Array of heading IDs to track

**Returns**: `string` - ID of currently active heading

**Implementation**:

```typescript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveId(entry.target.id);
      }
    });
  },
  {
    rootMargin: '-80px 0px -80% 0px',
    threshold: 0.1,
  }
);
```

**Root Margin Explained**:
- `-80px` top: Account for sticky header
- `-80%` bottom: Trigger when heading enters top 20% of viewport

### useLocalStorage

**File**: `src/hooks/useLocalStorage.ts`

**Purpose**: Syncs React state with localStorage, SSR-safe.

**Parameters**:
- `key: string` - localStorage key
- `initialValue: T` - Default value

**Returns**: `[T, (value: T) => void]` - State and setter

**Implementation**:

```typescript
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize from localStorage on mount
  useEffect(() => {
    const item = window.localStorage.getItem(key);
    if (item) setStoredValue(JSON.parse(item));
  }, [key]);

  // Sync to localStorage on change
  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}
```

**SSR Safety**: Uses `useEffect` to read from localStorage only on client

---

## Utility Functions

### Category Utilities

**File**: `src/lib/utils/category.ts`

#### buildCategoryMap

Converts category array to Map for O(1) lookup.

```typescript
export function buildCategoryMap(
  categories: Category[]
): Map<string, Category>
```

#### getCategoryPath

Generates hierarchical path string (e.g., "IT > Backend > Node.js").

```typescript
export function getCategoryPath(
  categoryId: string | null,
  categoryMap: Map<string, Category>,
  maxDepth?: number
): string
```

**Features**:
- Recursive traversal of parent categories
- Circular reference protection with maxDepth
- Returns "Uncategorized" for null categoryId

#### getDescendantCategoryIds

Finds all descendant category IDs using BFS.

```typescript
export function getDescendantCategoryIds(
  categoryId: string,
  categoryMap: Map<string, Category>
): string[]
```

**Algorithm**:
- Breadth-First Search (BFS)
- Circular reference protection
- Max depth: 10 levels

#### getCategorySlugByName

Maps category name to slug for URL generation.

```typescript
export function getCategorySlugByName(
  name: string,
  categoryMap: Map<string, Category>
): string
```

---

## Performance Optimization

### Caching Strategy

| Resource | Strategy | Duration | Location |
|----------|----------|----------|----------|
| Category pages | ISR | 1 hour | Vercel Edge |
| Post pages | ISR | 24 hours | Vercel Edge |
| Category tree | Client cache | 1 hour | localStorage |
| TOC state | Persistent | Indefinite | localStorage |

### Build-Time Generation

All category and post pages are statically generated at build time:

```bash
# Build process
npm run build

# Generates:
# - All /category/[slug] pages
# - All /posts/[slug] pages
# - Optimized bundles with tree-shaking
```

### Database Queries

- **Cached category tree**: Prevents redundant DB calls
- **RLS policies**: Database-level security without application logic
- **Index optimization**: Categories have indexes on `slug`, `parent_id`, `level`

---

## Accessibility

### ARIA Labels

- Breadcrumb: `aria-label="Breadcrumb"`
- TOC: `aria-label="Table of contents"`
- Collapse buttons: `aria-expanded` attribute

### Keyboard Navigation

- All links and buttons are keyboard accessible
- Focus states clearly visible
- Tab order follows visual hierarchy

### Semantic HTML

- `<nav>` for breadcrumb and TOC
- `<article>` for posts
- `<aside>` for sidebars
- `<main>` for primary content

---

## Testing Recommendations

### Unit Tests

- `useScrollSpy`: Mock IntersectionObserver
- `useLocalStorage`: Mock window.localStorage
- Category utilities: Test edge cases (null, circular refs)

### Integration Tests

- Category page: Verify post filtering
- TOC: Check heading extraction and scroll behavior
- Breadcrumb: Validate path generation

### E2E Tests

- Navigate category tree → verify URL changes
- Click TOC item → verify smooth scroll
- Collapse/expand sidebars → verify localStorage persistence

---

## Future Enhancements

- [ ] Search within category
- [ ] Sort posts (date, title, popularity)
- [ ] Pagination for large categories
- [ ] Related posts suggestions
- [ ] Category tags/filters
- [ ] TOC print-friendly mode
- [ ] Breadcrumb schema.org markup for SEO

---

Last updated: 2026-03-08
