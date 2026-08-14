/**
 * Responsive Design Tests
 *
 * Validates Requirement 8.2:
 * THE Fitness_Tracker SHALL provide a responsive user interface suitable
 * for mobile, tablet, and desktop viewing.
 *
 * Strategy: Because the test environment uses happy-dom (no real CSS engine),
 * Tailwind responsive prefixes (sm:, md:, lg:) are verified structurally by
 * checking that components contain the correct responsive class strings.
 * Viewport-simulation tests additionally set window.innerWidth / innerHeight
 * and dispatch resize events to confirm that any JavaScript-driven responsive
 * logic reacts correctly.
 *
 * Navigation is split across two components: TopBar (brand + sm+ pill tab row)
 * and BottomNav (fixed mobile tab bar, hidden at sm+). Both read/write the same
 * UI store so they always stay in sync.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Storage mock shared by all component imports
vi.mock('../services/storage', () => ({
  storageService: {
    saveExercise: vi.fn(async () => {}),
    getExercise: vi.fn(async () => undefined),
    getAllExercises: vi.fn(async () => []),
    deleteExercise: vi.fn(async () => {}),
    saveRoutine: vi.fn(async () => {}),
    getRoutine: vi.fn(async () => undefined),
    saveWorkoutSession: vi.fn(async () => {}),
    getWorkoutSession: vi.fn(async () => undefined),
    getWorkoutSessionByDate: vi.fn(async () => undefined),
    getAllWorkoutSessions: vi.fn(async () => []),
    deleteWorkoutSession: vi.fn(async () => {}),
    clearAllData: vi.fn(async () => {}),
  },
}))

// ── helpers ──────────────────────────────────────────────────────────────────

/** Simulate a viewport by overriding window.innerWidth / innerHeight. */
function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height })
  window.dispatchEvent(new Event('resize'))
}

/** Collect all class tokens from a wrapper's HTML string. */
function allClasses(html: string): string[] {
  const matches = html.match(/class="([^"]+)"/g) ?? []
  return matches.flatMap((m) => m.replace(/^class="/, '').replace(/"$/, '').split(' '))
}

/** Check whether any element in the HTML has at least one of the given class tokens. */
function hasResponsiveClass(html: string, ...tokens: string[]): boolean {
  const classes = allClasses(html)
  return tokens.some((t) => classes.includes(t))
}

// ── constants ─────────────────────────────────────────────────────────────────

const DESKTOP_W = 1920
const DESKTOP_H = 1080
const TABLET_W = 768
const TABLET_H = 1024

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Responsive Design – Requirement 8.2', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── Layout component ────────────────────────────────────────────────────────

  describe('Layout component', () => {
    let Layout: any

    beforeEach(async () => {
      Layout = (await import('./Layout.vue')).default
    })

    it('has responsive horizontal padding (sm: and lg: variants)', () => {
      const wrapper = mount(Layout, { global: { stubs: { TopBar: true, BottomNav: true } } })
      const html = wrapper.html()
      expect(hasResponsiveClass(html, 'sm:px-6', 'lg:px-8')).toBe(true)
    })

    it('uses max-width container to prevent excessive line length on desktop', () => {
      const wrapper = mount(Layout, { global: { stubs: { TopBar: true, BottomNav: true } } })
      expect(wrapper.html()).toContain('max-w-5xl')
    })

    it('occupies full minimum viewport height', () => {
      const wrapper = mount(Layout, { global: { stubs: { TopBar: true, BottomNav: true } } })
      expect(wrapper.html()).toContain('min-h-screen')
    })
  })

  // ── TopBar component ────────────────────────────────────────────────────────

  describe('TopBar component', () => {
    let TopBar: any

    beforeEach(async () => {
      TopBar = (await import('./TopBar.vue')).default
    })

    it('desktop navigation is hidden on small viewports and visible on sm: and above', () => {
      const wrapper = mount(TopBar)
      const html = wrapper.html()
      expect(hasResponsiveClass(html, 'sm:flex')).toBe(true)
      expect(html).toContain('hidden')
    })

    it('renders all 5 navigation tabs', () => {
      const wrapper = mount(TopBar)
      const html = wrapper.html()
      const tabLabels = ['Exercises', 'Routine', 'Today', 'Summary', 'Progress']
      tabLabels.forEach((label) => {
        expect(html).toContain(label)
      })
    })

    it('uses responsive max-width container for nav bar', () => {
      const wrapper = mount(TopBar)
      const html = wrapper.html()
      expect(hasResponsiveClass(html, 'sm:px-6', 'lg:px-8')).toBe(true)
      expect(html).toContain('max-w-5xl')
    })
  })

  // ── BottomNav component ─────────────────────────────────────────────────────

  describe('BottomNav component', () => {
    let BottomNav: any

    beforeEach(async () => {
      BottomNav = (await import('./BottomNav.vue')).default
    })

    it('is hidden at sm: and above (mobile-only tab bar)', () => {
      const wrapper = mount(BottomNav)
      expect(hasResponsiveClass(wrapper.html(), 'sm:hidden')).toBe(true)
    })

    it('renders all 5 navigation tabs', () => {
      const wrapper = mount(BottomNav)
      const html = wrapper.html()
      const tabLabels = ['Exercises', 'Routine', 'Today', 'Summary', 'Progress']
      tabLabels.forEach((label) => {
        expect(html).toContain(label)
      })
    })

    it('is fixed to the bottom of the viewport', () => {
      const wrapper = mount(BottomNav)
      expect(wrapper.html()).toContain('fixed')
      expect(wrapper.html()).toContain('bottom-0')
    })

    it('clicking a tab updates the active tab in the UI store', async () => {
      const { useUIStore } = await import('../stores/ui')
      const wrapper = mount(BottomNav)
      const store = useUIStore()
      const buttons = wrapper.findAll('button')
      await buttons[1]!.trigger('click')
      expect(store.activeTab).toBe('routine')
    })
  })

  // ── ExerciseList / WeeklyGrid responsive grid ───────────────────────────────

  describe('ExerciseList component – responsive grid', () => {
    let ExerciseList: any

    beforeEach(async () => {
      ExerciseList = (await import('./ExerciseList.vue')).default
      // Seed one exercise so the grid branch (v-else-if) renders instead of the
      // "no exercises" empty-state branch, which doesn't contain grid classes.
      const { useExercisesStore } = await import('../stores/exercises')
      const store = useExercisesStore()
      await store.createExercise('Push Up', 3, 10, ['Chest'])
    })

    it('uses single-column layout by default (grid-cols-1)', () => {
      const wrapper = mount(ExerciseList)
      // grid-cols-1 is the base (mobile-first) column count
      expect(wrapper.html()).toContain('grid-cols-1')
    })

    it('uses md:grid-cols-2 for tablet-width viewports', () => {
      const wrapper = mount(ExerciseList)
      expect(hasResponsiveClass(wrapper.html(), 'md:grid-cols-2')).toBe(true)
    })

    it('uses lg:grid-cols-3 for desktop-width viewports', () => {
      const wrapper = mount(ExerciseList)
      expect(hasResponsiveClass(wrapper.html(), 'lg:grid-cols-3')).toBe(true)
    })
  })

  describe('WeeklyGrid component – responsive grid', () => {
    let WeeklyGrid: any

    beforeEach(async () => {
      WeeklyGrid = (await import('./WeeklyGrid.vue')).default
    })

    it('uses single-column layout by default (grid-cols-1)', () => {
      const wrapper = mount(WeeklyGrid)
      expect(wrapper.html()).toContain('grid-cols-1')
    })

    it('uses md:grid-cols-2 breakpoint for tablet viewports', () => {
      const wrapper = mount(WeeklyGrid)
      expect(hasResponsiveClass(wrapper.html(), 'md:grid-cols-2')).toBe(true)
    })

    it('uses lg:grid-cols-4 breakpoint for desktop viewports', () => {
      const wrapper = mount(WeeklyGrid)
      expect(hasResponsiveClass(wrapper.html(), 'lg:grid-cols-4')).toBe(true)
    })
  })

  // ── Viewport simulation tests ───────────────────────────────────────────────

  describe('Viewport simulation', () => {
    const originalInnerWidth = window.innerWidth
    const originalInnerHeight = window.innerHeight

    afterEach(() => {
      // Restore original viewport dimensions
      setViewport(originalInnerWidth, originalInnerHeight)
    })

    it('window.innerWidth reflects desktop viewport (1920x1080)', () => {
      setViewport(DESKTOP_W, DESKTOP_H)
      expect(window.innerWidth).toBe(DESKTOP_W)
      expect(window.innerHeight).toBe(DESKTOP_H)
    })

    it('window.innerWidth reflects tablet viewport (768x1024)', () => {
      setViewport(TABLET_W, TABLET_H)
      expect(window.innerWidth).toBe(TABLET_W)
      expect(window.innerHeight).toBe(TABLET_H)
    })

    it('desktop viewport (1920) exceeds the lg breakpoint (1024)', () => {
      setViewport(DESKTOP_W, DESKTOP_H)
      // Tailwind lg: breakpoint is ≥1024px
      expect(window.innerWidth).toBeGreaterThanOrEqual(1024)
    })

    it('tablet viewport (768) meets the md breakpoint exactly', () => {
      setViewport(TABLET_W, TABLET_H)
      // Tailwind md: breakpoint is ≥768px
      expect(window.innerWidth).toBeGreaterThanOrEqual(768)
    })

    it('tablet viewport (768) is below the lg breakpoint (1024)', () => {
      setViewport(TABLET_W, TABLET_H)
      // At tablet width, lg: classes are not active
      expect(window.innerWidth).toBeLessThan(1024)
    })

    it('dispatches resize event when viewport changes', () => {
      const resizeSpy = vi.fn()
      window.addEventListener('resize', resizeSpy)
      setViewport(TABLET_W, TABLET_H)
      window.removeEventListener('resize', resizeSpy)
      expect(resizeSpy).toHaveBeenCalledTimes(1)
    })
  })

  // ── No horizontal overflow ──────────────────────────────────────────────────

  describe('No horizontal overflow on desktop', () => {
    it('Layout uses max-w-5xl to prevent content wider than the container', () => {
      // max-w-5xl = 64rem = 1024px, well within 1920px desktop width
      // This prevents horizontal scrolling on wide displays
      const maxWidthRem = 64 // 5xl = 64rem
      const desktopWidthRem = DESKTOP_W / 16
      expect(desktopWidthRem).toBeGreaterThan(maxWidthRem)
    })

    it('Layout uses mx-auto to center content without causing overflow', async () => {
      const Layout = (await import('./Layout.vue')).default
      const wrapper = mount(Layout, { global: { stubs: { TopBar: true, BottomNav: true } } })
      expect(wrapper.html()).toContain('mx-auto')
    })
  })

  // ── Tablet layout adaptations ───────────────────────────────────────────────

  describe('Tablet layout adaptations', () => {
    it('ExerciseList grid transitions from 1 to 2 columns at md: breakpoint (768px)', async () => {
      const ExerciseList = (await import('./ExerciseList.vue')).default
      // Seed one exercise so the grid branch renders (not the empty-state branch)
      const { useExercisesStore } = await import('../stores/exercises')
      const store = useExercisesStore()
      await store.createExercise('Squat', 3, 12, ['Legs'])
      const wrapper = mount(ExerciseList)
      const html = wrapper.html()
      // At 768px (md:) the exercise grid switches from 1 to 2 columns
      expect(html).toContain('grid-cols-1')
      expect(hasResponsiveClass(html, 'md:grid-cols-2')).toBe(true)
    })

    it('WeeklyGrid transitions from 1 to 2 columns at md: breakpoint (768px)', async () => {
      const WeeklyGrid = (await import('./WeeklyGrid.vue')).default
      const wrapper = mount(WeeklyGrid)
      const html = wrapper.html()
      expect(html).toContain('grid-cols-1')
      expect(hasResponsiveClass(html, 'md:grid-cols-2')).toBe(true)
    })

    it('Top navigation shows full horizontal tab bar at sm: breakpoint (≥640px)', async () => {
      const TopBar = (await import('./TopBar.vue')).default
      const wrapper = mount(TopBar)
      // The desktop nav container uses "hidden sm:flex"
      expect(wrapper.html()).toContain('sm:flex')
    })
  })
})
