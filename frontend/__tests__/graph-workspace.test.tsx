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
        onClearPath={vi.fn()}
        onClose={vi.fn()}
        onSelectNode={vi.fn()}
        onTracePath={vi.fn()}
        pathIds={null}
        pathPending={false}
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
        onClearPath={vi.fn()}
        onClose={vi.fn()}
        onSelectNode={onSelectNode}
        onTracePath={vi.fn()}
        pathIds={null}
        pathPending={false}
        open
        selectedEntityId="disease:alzheimers"
      />,
    );

    fireEvent.click(screen.getByTestId("force-graph"));
    expect(onSelectNode).toHaveBeenCalledWith("P05067", "protein");
  });
});


describe("GraphWorkspace shortest-connection readout", () => {
  const props = {
    graphData: sampleGraph,
    graphHops: 1 as const,
    graphRootId: "disease:alzheimers",
    graphSelectionId: "disease:alzheimers",
    highlightedIds: [],
    loading: false,
    onChangeHops: vi.fn(),
    onClearPath: vi.fn(),
    onClose: vi.fn(),
    onSelectNode: vi.fn(),
    onTracePath: vi.fn(),
    open: true,
    selectedEntityId: "disease:alzheimers",
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("shows nothing when no path has been requested", () => {
    render(<GraphWorkspace {...props} pathIds={null} pathPending={false} />);
    expect(screen.queryByTestId("graph-path-strip")).not.toBeInTheDocument();
  });

  it("renders the route with node labels and a hop count", () => {
    render(
      <GraphWorkspace
        {...props}
        pathIds={["disease:alzheimers", "P05067"]}
        pathPending={false}
      />,
    );

    const strip = screen.getByTestId("graph-path-strip");
    // 2 nodes is 1 hop, and the singular has to be right -- an off-by-one here
    // is the kind of thing that reads as sloppy in a demo.
    expect(strip).toHaveTextContent("1 hop");
    expect(strip).not.toHaveTextContent("1 hops");
    // Labels, not raw ids: "Alzheimer's disease", not "disease:alzheimers".
    expect(strip).toHaveTextContent("Alzheimer's disease");
    expect(strip).toHaveTextContent("APP");
  });

  it("pluralises the hop count past one", () => {
    render(
      <GraphWorkspace
        {...props}
        pathIds={["disease:alzheimers", "P05067", "drug:lecanemab"]}
        pathPending={false}
      />,
    );
    expect(screen.getByTestId("graph-path-strip")).toHaveTextContent("2 hops");
  });

  it("distinguishes an unconnected pair from no request", () => {
    // The endpoint 404s when both entities exist but nothing connects them.
    // That is an answer and has to read differently from an empty state.
    render(<GraphWorkspace {...props} pathIds={[]} pathPending={false} />);
    expect(screen.getByTestId("graph-path-strip")).toHaveTextContent(
      /no connection between these entities/i,
    );
  });

  it("re-roots the graph when a node in the route is clicked", () => {
    const onSelectNode = vi.fn();
    render(
      <GraphWorkspace
        {...props}
        onSelectNode={onSelectNode}
        pathIds={["disease:alzheimers", "P05067"]}
        pathPending={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "APP" }));
    expect(onSelectNode).toHaveBeenCalledWith("P05067", "protein");
  });

  it("offers a trace affordance for a non-root node and disables it while pending", () => {
    // The inspected node must not be the root: tracing a path from the root to
    // itself is meaningless, and the affordance is correctly hidden there.
    const inspectingProtein = { ...props, graphSelectionId: "P05067" };

    const { rerender } = render(
      <GraphWorkspace {...inspectingProtein} pathIds={null} pathPending={false} />,
    );
    expect(
      screen.getByRole("button", { name: /trace path from root/i }),
    ).toBeEnabled();

    // The label is deliberately stable across states; progress shows as
    // disabled + aria-busy so the control stays unambiguously targetable.
    rerender(<GraphWorkspace {...inspectingProtein} pathIds={null} pathPending />);
    const affordance = screen.getByRole("button", { name: /trace path from root/i });
    expect(affordance).toBeDisabled();
    expect(affordance).toHaveAttribute("aria-busy", "true");
  });

  it("hides the trace affordance when the inspected node is the root", () => {
    render(<GraphWorkspace {...props} pathIds={null} pathPending={false} />);
    expect(
      screen.queryByRole("button", { name: /trace path from root/i }),
    ).not.toBeInTheDocument();
  });
});
