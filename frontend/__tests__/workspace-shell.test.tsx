import { render, screen } from "@testing-library/react";

import { WorkspaceShell } from "@/components/WorkspaceShell";


describe("WorkspaceShell", () => {
  it("renders the docked command bar, stage, and right rail slots", () => {
    render(
      <WorkspaceShell
        commandBar={<div>Command bar slot</div>}
        graph={<div>Graph slot</div>}
        guide={<div>Guide slot</div>}
        stageFooter={<div>Stage footer slot</div>}
        stageOverlay={<div>Stage overlay slot</div>}
        viewport={<div>Viewport slot</div>}
      />,
    );

    expect(screen.getByText("Command bar slot")).toBeInTheDocument();
    expect(screen.getByText("Viewport slot")).toBeInTheDocument();
    expect(screen.getByText("Graph slot")).toBeInTheDocument();
    expect(screen.getByText("Guide slot")).toBeInTheDocument();
    expect(screen.getByText("Stage overlay slot")).toBeInTheDocument();
    expect(screen.getByText("Stage footer slot")).toBeInTheDocument();
  });
});
