import { render, screen } from '@testing-library/react'
import Sample from './Sample'

test('renders Hello World', () => {
  render(<Sample />)
  expect(screen.getByText('Hello World')).toBeInTheDocument()
})
