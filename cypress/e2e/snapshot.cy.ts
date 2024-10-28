describe("스냅샷 테스트들", () => {
  let url: string;

  beforeEach(() => {
    url = {
      local: "http://localhost:5173",
      staging: "http://localhost:3000",
    }[Cypress.env("TARGET") as "local" | "staging"];
  });

  it("Skills Tab", () => {
    cy.visit(url);
    cy.get('[aria-label="skills"]').click();
    cy.percySnapshot("Skills Tab");
  });

  it("Experience Tab", () => {
    cy.visit(url);
    cy.get('[aria-label="experience"]').click();
    cy.percySnapshot("Experience Tab");
  });

  it("Projects Tab", () => {
    cy.visit(url);
    cy.get('[aria-label="projects"]').click();
    cy.percySnapshot("Projects Tab");
  });

  it("Awards Tab", () => {
    cy.visit(url);
    cy.get('[aria-label="awards"]').click();
    cy.percySnapshot("Awards Tab");
  });

  it("Employee Card Tab", () => {
    cy.visit(url);
    cy.get('[aria-label="employee card"]').click();
    cy.percySnapshot("Employee Card Tab");
  });
});
