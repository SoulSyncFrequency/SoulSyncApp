import { renderHook, act } from '@testing-library/react'
import { useMagic } from './useMagic'

test('increments value', () => {
  const { result } = renderHook(()=>useMagic())
  act(()=>{ result.current.inc() })
  expect(result.current.value).toBe(1)
})
