import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import VoiceModeToggle from './VoiceModeToggle'

describe('VoiceModeToggle', () => {
  it('renders the voice mode copy and toggles the switch', () => {
    const onChange = vi.fn()

    render(React.createElement(VoiceModeToggle, { enabled: false, onChange }))

    expect(screen.getByText('Voice mode')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch', { name: 'Voice mode' }))

    expect(onChange).toHaveBeenCalledWith(true)
  })
})
