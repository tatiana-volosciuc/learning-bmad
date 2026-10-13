import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FeaturedBadge } from './FeaturedBadge'

describe('FeaturedBadge', () => {
  it('renders amber badge with Featured label', () => {
    render(<FeaturedBadge />)

    const badge = screen.getByRole('status')
    expect(badge).toHaveTextContent('Featured')
    expect(badge.className).toContain('bg-amber-100')
  })

  it('applies sm size classes by default', () => {
    render(<FeaturedBadge />)

    expect(screen.getByRole('status').className).toContain('text-xs')
  })

  it('applies md size classes when size="md"', () => {
    render(<FeaturedBadge size="md" />)

    expect(screen.getByRole('status').className).toContain('text-sm')
  })
})
