describe('Therapy flow', () => {
  it('loads home and navigates to therapy page', () => {
    cy.visit('/')
    cy.contains('Therapy').click({force:true})
    cy.url().should('include', '/therapy')
  })

  it('generates a therapy plan (mocked minimal)', () => {
    // Minimal UI selectors may differ; adapt as needed
    cy.visit('/therapy')
    cy.get('input[name="disease"]').type('BPD')
    cy.contains('Generate').click({force:true})
    cy.contains(/Plan|PDF|Download/i, { timeout: 20000 })
  })
})
