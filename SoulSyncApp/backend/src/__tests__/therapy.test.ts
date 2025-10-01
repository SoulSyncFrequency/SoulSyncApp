import { buildUltraPlan } from '../engine/ultra51c'
test('plan has smiles and 5 days', () => {
  const plan = buildUltraPlan({ disease: 'Depression' })
  expect(plan.smiles).toBeTruthy()
  expect(plan.plan5day.length).toBe(5)
})
