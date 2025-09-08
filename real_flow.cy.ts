describe('Real backend flow', () => {
  it('register -> login -> generate therapy -> download PDF', () => {
    const email = `user_${Date.now()}@e2e.com`
    const password = 'secret123'

    // Register
    cy.request('POST', `${Cypress.env('API_BASE') || 'http://localhost:5000'}/api/auth/register`, { email, password })
      .its('body').should('have.property', 'ok', true)

    // Login to get token
    cy.request('POST', `${Cypress.env('API_BASE') || 'http://localhost:5000'}/api/auth/login`, { email, password })
      .then(res => {
        expect(res.body.ok).to.be.true
        const token = res.body.token

        // Visit app with Vite pointing to real API via env; just use UI for therapy
        cy.visit('/therapy')
        cy.get('input[placeholder="e.g., Depression"], input[placeholder="npr. Depresija"]').clear().type('PTSD')
        cy.get('input[placeholder*="Symptoms"], input[placeholder*="Simptomi"]').clear().type('insomnia')
        cy.contains('Generate Therapy').click().then(()=>{
          cy.contains('5‑Day Plan').should('exist')
          cy.contains('Download PDF').should('have.attr','href').then((href:any)=>{
            cy.request({ url: href, encoding: 'binary' }).then((resp) => {
            expect(resp.status).to.eq(200)
            expect(resp.headers['content-type']).to.include('application/pdf')
            // minimal sanity check on size
            expect(resp.body.length).to.be.greaterThan(500)
          })
          })
        })
      })
  })
})
