import type { Release } from "@genomecanvas/query";

/** The map as text: every protein on it, for screen readers. Visually hidden. */
export function ProteinTable({ release }: { release: Release }) {
  const { categories } = release.manifest;
  return (
    <table className="sr-only">
      <caption>Proteins on the map</caption>
      <thead>
        <tr>
          <th scope="col">Gene</th>
          <th scope="col">Protein</th>
          <th scope="col">Function</th>
          <th scope="col">UniProt accession</th>
        </tr>
      </thead>
      <tbody>
        {release.proteins.map((p) => (
          <tr key={p.accession}>
            <th scope="row">{p.geneSymbol}</th>
            <td>{p.name}</td>
            <td>{categories[p.category]?.label}</td>
            <td>{p.accession}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
