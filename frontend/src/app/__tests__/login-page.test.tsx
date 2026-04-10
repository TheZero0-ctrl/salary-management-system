import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import LoginPage from '../login/page'

describe('Login page', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders email and password fields with a sign in button', () => {
    render(<LoginPage />)

    expect(screen.getByLabelText('Email')).toBeDefined()
    expect(screen.getByLabelText('Password')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDefined()
  })

  it('shows validation messages when submitting empty fields', () => {
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByText('Email is required')).toBeDefined()
    expect(screen.getByText('Password is required')).toBeDefined()
  })
})
