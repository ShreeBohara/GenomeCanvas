import { act, fireEvent, render, screen } from "@testing-library/react";

import { GraphWorkspace } from "@/components/GraphWorkspace";
import { GraphData } from "@/lib/types";


const graphApi = {
  d3Force: vi.fn(() => ({
    distance: vi.fn(),
    strength: vi.fn(),
  })),
  d3VelocityDecay: vi.fn(),
  d3AlphaDecay: vi.fn(),
  d3ReheatSimulation: vi.fn(),
  zoomToFit: vi.fn(),
};

vi.mock("next/dynamic", async () => {
  const React = await import("react");

  return {
    default: () =>
      React.forwardRef<any, any>((props, ref) => {
        React.useImperativeHandle(ref, () => graphApi);
        return (
          <button
            data-testid="force-graph"
            onClick={() => props.onNodeClick?.(props.graphData.nodes[1])}
            type="button"
          >
            Graph mock
          </button>
        );
      }),
  };
});

const sampleGraph: GraphData = {
  nodes: [
    {
      id: "disease:alzheimers",
      label: "Alzheimer's disease",
      type: "disease",
      properties: {
        source: "fixture",
      },
    },
    {
      id: "P05067",
      label: "APP",
      type: "protein",
      properties: {
        gene_name: "APP",
      },
    },
  ],
  edges: [
    {
      source: "P05067",
      target: "disease:alzheimers",
      label: "ASSOCIATED_WITH",
      properties: {
        score: 0.96,
      },
    },
  ],
};

describe("GraphWorkspace", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.values(graphApi).forEach((value) => {
      if (typeof value === "function" && "mockReset" in value) {
        value.mockReset();
      }
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("refits the graph on load and exposes hop controls", () => {
    const onChangeHops = vi.fn();

    render(
      <GraphWorkspace
        graphData={sampleGraph}
        graphHops={1}
        graphRootId="disease:alzheimers"
        graphSelectionId="disease:alzheimers"
        highlightedIds={["P05067"]}
        loading={false}
        onChangeHops={onChangeHops}
        onClose={vi.fn()}
        onSelectNode={vi.fn()}
        open
        selectedEntityId="disease:alzheimers"
      />,
    );

    act(() => {
      vi.advanceTimersByTime(320);
    });

    expect(graphApi.zoomToFit).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "2 hops" }));
    expect(onChangeHops).toHaveBeenCalledWith(2);
  });

  it("emits node selections from the force graph", () => {
    const onSelectNode = vi.fn();

    render(
      <GraphWorkspace
        graphData={sampleGraph}
        graphHops={1}
        graphRootId="disease:alzheimers"
        graphSelectionId="disease:alzheimers"
        highlightedIds={[]}
        loading={false}
        onChangeHops={vi.fn()}
        onClose={vi.fn()}
        onSelectNode={onSelectNode}
        open
        selectedEntityId="disease:alzheimers"
      />,
    );

    fireEvent.click(screen.getByTestId("force-graph"));
    expect(onSelectNode).toHaveBeenCalledWith("P05067", "protein");
  });
});
