/**
 * Fetch AlphaFold CIF files for all 50 proteins and extract
 * alpha-carbon (CA) backbone traces + pLDDT confidence scores.
 * Outputs: ../src/data/backbones.json
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const UNIPROT_IDS = [
  "P31749","P00533","P12931","P00519","P15056","Q02750","P11802","Q00534","O60674","P04626",
  "P01116","P01111","P42336","P42345","P60484","P06400","P04637","Q00987","P35222","P46531",
  "P02452","P02458","P02751","P02545","P08670","P68363","P68133","P17661","P05783","P12883",
  "Q01959","P31645","P08183","Q9UNQ0","P13569","P35670","P11166","Q13621","O15245","Q14654",
  "P38398","P51587","Q13315","Q13535","P40692","P43246","Q06609","P09874","Q12888","O96017",
];

const MAX_POINTS = 250;

function parseCIF(cifText) {
  const lines = cifText.split("\n");
  const caAtoms = [];

  let inAtomSite = false;
  let columns = [];
  let colIdx = {};

  for (const line of lines) {
    if (line.startsWith("_atom_site.")) {
      inAtomSite = true;
      const colName = line.trim().split(/\s+/)[0].replace("_atom_site.", "");
      columns.push(colName);
      colIdx[colName] = columns.length - 1;
      continue;
    }

    if (inAtomSite && (line.startsWith("ATOM") || line.startsWith("HETATM"))) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < columns.length) continue;

      const atomId = parts[colIdx["label_atom_id"]];
      const modelNum = parts[colIdx["pdbx_PDB_model_num"]];
      const asymId = parts[colIdx["label_asym_id"]];

      if (atomId === "CA" && modelNum === "1" && asymId === "A") {
        const x = parseFloat(parts[colIdx["Cartn_x"]]);
        const y = parseFloat(parts[colIdx["Cartn_y"]]);
        const z = parseFloat(parts[colIdx["Cartn_z"]]);
        const bFactor = parseFloat(parts[colIdx["B_iso_or_equiv"]]);
        caAtoms.push({ x, y, z, plddt: bFactor });
      }
    } else if (inAtomSite && !line.startsWith("ATOM") && !line.startsWith("HETATM") && line.trim() !== "" && !line.startsWith("#") && !line.startsWith("_atom_site.")) {
      if (caAtoms.length > 0) break;
    }
  }

  return caAtoms;
}

function downsample(atoms, maxPoints) {
  if (atoms.length <= maxPoints) return atoms;
  const step = atoms.length / maxPoints;
  const result = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(atoms[Math.floor(i * step)]);
  }
  return result;
}

function centerAndNormalize(atoms) {
  let cx = 0, cy = 0, cz = 0;
  for (const a of atoms) { cx += a.x; cy += a.y; cz += a.z; }
  cx /= atoms.length; cy /= atoms.length; cz /= atoms.length;

  for (const a of atoms) { a.x -= cx; a.y -= cy; a.z -= cz; }

  let maxR = 0;
  for (const a of atoms) {
    const r = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    if (r > maxR) maxR = r;
  }

  if (maxR > 0) {
    for (const a of atoms) {
      a.x /= maxR;
      a.y /= maxR;
      a.z /= maxR;
    }
  }

  return atoms;
}

async function getCifUrl(uniprotId) {
  const apiUrl = `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`;
  const resp = await fetch(apiUrl);
  if (!resp.ok) return null;
  const data = await resp.json();
  // First entry is the canonical isoform
  if (Array.isArray(data) && data.length > 0) {
    return data[0].cifUrl;
  }
  return null;
}

async function fetchBackbone(uniprotId) {
  console.log(`  Fetching ${uniprotId}...`);

  // First get the correct CIF URL from the API
  const cifUrl = await getCifUrl(uniprotId);
  if (!cifUrl) {
    console.warn(`  WARNING: No CIF URL found for ${uniprotId}`);
    return null;
  }

  const resp = await fetch(cifUrl);
  if (!resp.ok) {
    console.warn(`  WARNING: Failed to fetch CIF for ${uniprotId}: ${resp.status}`);
    return null;
  }

  const text = await resp.text();
  let atoms = parseCIF(text);

  if (atoms.length === 0) {
    console.warn(`  WARNING: No CA atoms found for ${uniprotId}`);
    return null;
  }

  console.log(`  ${uniprotId}: ${atoms.length} CA atoms -> ${Math.min(atoms.length, MAX_POINTS)} points`);

  atoms = downsample(atoms, MAX_POINTS);
  atoms = centerAndNormalize(atoms);

  return {
    points: atoms.map(a => [
      Math.round(a.x * 10000) / 10000,
      Math.round(a.y * 10000) / 10000,
      Math.round(a.z * 10000) / 10000,
    ]),
    plddt: atoms.map(a => Math.round(a.plddt * 10) / 10),
  };
}

async function main() {
  console.log(`Fetching AlphaFold backbones for ${UNIPROT_IDS.length} proteins...\n`);

  const backbones = {};
  let success = 0;
  let failed = 0;

  // Fetch in batches of 5
  for (let i = 0; i < UNIPROT_IDS.length; i += 5) {
    const batch = UNIPROT_IDS.slice(i, i + 5);
    const results = await Promise.all(batch.map(id => fetchBackbone(id)));

    for (let j = 0; j < batch.length; j++) {
      if (results[j]) {
        backbones[batch[j]] = results[j];
        success++;
      } else {
        failed++;
      }
    }
  }

  const outPath = join(__dirname, "..", "src", "data", "backbones.json");
  writeFileSync(outPath, JSON.stringify(backbones));

  const stats = JSON.stringify(backbones).length;
  console.log(`\nDone! ${success} succeeded, ${failed} failed.`);
  console.log(`Output: ${outPath} (${(stats / 1024).toFixed(1)} KB)`);
}

main().catch(console.error);
