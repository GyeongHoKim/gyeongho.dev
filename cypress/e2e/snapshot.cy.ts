describe("스냅샷 테스트들", () => {
  it("메인 페이지", () => {
    cy.visit("https://gyeongho.dev");
    cy.wait(1000);
    cy.percySnapshot("메인 페이지");
  });
});
