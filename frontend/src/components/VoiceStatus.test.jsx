import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import VoiceStatus from './VoiceStatus'

describe('VoiceStatus', () => {
  it('announces the current voice capture state', () => {
    render(
      React.createElement(VoiceStatus, {
        mode: 'transcribing',
        title: 'Turning speech into text',
        description: 'Hold on while we transcribe your latest recording.',
      })
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Turning speech into text')).toBeInTheDocument()
    expect(screen.getByText('Hold on while we transcribe your latest recording.')).toBeInTheDocument()
  })
})
