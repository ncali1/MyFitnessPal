/**
 * Unit tests for BodyWeightChart's empty-state and heading rendering. Actual Chart.js
 * canvas rendering isn't exercised here — this codebase doesn't mount Chart.js-backed
 * components under happy-dom elsewhere either (see ProgressGraphs' tests, which test
 * the underlying data/store logic instead of the chart components directly).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import BodyWeightChart from './BodyWeightChart.vue'

describe('BodyWeightChart', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows an empty state and does not attempt to render a canvas when there are no logs', () => {
    render(BodyWeightChart, { props: { logs: [] } })

    expect(screen.getByText(/no body weight logged yet/i)).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('shows the current display unit in the heading', () => {
    render(BodyWeightChart, { props: { logs: [] } })
    expect(screen.getByText(/body weight over time \(kg\)/i)).toBeTruthy()
  })
})
