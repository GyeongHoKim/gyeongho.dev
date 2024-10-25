describe("스냅샷 테스트들", () => {
  it("Skills Tab", () => {
    cy.visit("https://gyeongho.dev");
    cy.get('[aria-label="skills"]').click();
    cy.percySnapshot("Skills Tab");
  });

  it("Experience Tab", () => {
    cy.visit("https://gyeongho.dev");
    cy.get('[aria-label="experience"]').click();
    cy.percySnapshot("Experience Tab");
  });

  it("Projects Tab", () => {
    cy.visit("https://gyeongho.dev");
    cy.get('[aria-label="projects"]').click();
    cy.percySnapshot("Projects Tab");
  });

  it("Awards Tab", () => {
    cy.visit("https://gyeongho.dev");
    cy.get('[aria-label="awards"]').click();
    cy.percySnapshot("Awards Tab");
  });
});
