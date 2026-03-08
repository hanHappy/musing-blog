# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **Category filtering pages** (`/category/[slug]`)
  - Displays posts from a category and its descendants
  - Shows category description and subcategories in right sidebar
  - ISR with 1-hour revalidation
  - Static generation for all categories at build time

- **Table of Contents component** (`TableOfContents.tsx`)
  - Automatically extracts H2 and H3 headings from markdown
  - Scroll spy highlighting for active section
  - Collapsible UI with localStorage persistence
  - Smooth scroll navigation

- **Breadcrumb navigation** (`Breadcrumb.tsx`)
  - Shows hierarchical category path
  - Clickable segments for all parent categories
  - Current page shown without link
  - Accessible navigation with ARIA labels

- **3-column layout** for post and category pages
  - Left: Collapsible category tree sidebar
  - Center: Main content (55% width on large screens)
  - Right: Table of Contents or Category Info

- **Custom hooks**
  - `useScrollSpy.ts`: IntersectionObserver-based heading tracker
  - `useLocalStorage.ts`: SSR-safe localStorage hook

- **Type definitions**
  - `BreadcrumbSegment`: Type for breadcrumb navigation
  - `TocItem`: Type for table of contents items

- **Constants** (`lib/constants.ts`)
  - `STORAGE_KEYS.TOC_COLLAPSED`: localStorage key for TOC state
  - Cache duration constants for categories and posts

### Changed
- **Post metadata display**: Removed `updated_at` field from post pages
- **Post page layout**: Refactored to 3-column responsive design
- **Category page layout**: Refactored to 3-column responsive design with `CategoryInfo` sidebar

### Fixed
- **ESLint errors**: Resolved all 11 linting errors
  - Fixed type imports across all files
  - Removed unused variables and imports
  - Corrected async function usage in components

### Performance
- **Static generation**: Category pages now pre-generated at build time
- **ISR optimization**: Category tree cached for 24 hours
- **Client-side caching**: TOC collapse state persisted in localStorage

---

## Project Info

**Tech Stack**:
- Next.js 14 (App Router)
- Supabase (PostgreSQL + pgvector)
- OpenAI API (Embedding + Completion)
- TypeScript

**Cost Optimization**:
- Static-first rendering (SSG/ISR)
- Edge caching with Vercel
- Minimal runtime computation
- Zero paid dependencies

**Architecture**:
- 3-level category hierarchy
- RAG-powered chatbot
- RLS-protected database
- Multi-agent development system (CLAUDE.md)
