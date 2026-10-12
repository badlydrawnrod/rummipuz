import { createGameState } from './state.js';
import { ratePuzzle } from './difficulty.js';
import { solutionStructure } from './structural-difficulty.js';
import { EASY_PRIORITY, CORE_PRIORITY, easyMechanisms, coreMechanisms } from './mechanisms-v6.js';
import { enumeratePhysicalPartitions } from './partitions-v6.js';
import { semanticKeys, mechanismProfile } from './signatures-v6.js';

export const V6_MAX_NODES = 200000;
// Diagnostics cannot confer a tier or family. Proof still visits every partition.
export const V6_SIGNATURE_PARTITIONS = 64;
export function rateVarietyPuzzle(puzzle, { maxNodes = V6_MAX_NODES } = {}) {
  const base = ratePuzzle(puzzle, { maxNodes });
  if (base.status !== 'rated') return base;
  const state = createGameState(puzzle), tier = base.tier, minimum = base.features.rearrangement;
  let nodes = base.nodes, minimumPartitions = 0, common = null, witness = null, counterexample = null;
  const union = new Set(), bypass = {}, easyWitnesses = new Map(), records = new Map();
  const priority = tier === 1 ? EASY_PRIORITY : CORE_PRIORITY;
  const geometry = semanticKeys(state).geometry;
  const enumeration = enumeratePhysicalPartitions(state, () => {
    if (nodes >= maxNodes) return false;
    nodes += 1; return true;
  }, (board) => {
    const structure = solutionStructure(state, board);
    if (tier > 1 && !structure.components.some((c) => c.rows.length >= tier && c.nonEndpointRows.length >= tier - 1)) {
      counterexample = board; return false;
    }
    if (structure.changedRows.length !== minimum) return true;
    minimumPartitions += 1;
    const predicates = tier === 1 ? easyMechanisms(state, board, structure) : coreMechanisms(state, board, tier, structure);
    for (const name of predicates) {
      union.add(name);
      if (tier === 1 && !easyWitnesses.has(name)) easyWitnesses.set(name, board);
    }
    common = common === null ? new Set(predicates) : new Set([...common].filter((name) => predicates.includes(name)));
    for (const name of priority) if (!predicates.includes(name) && !bypass[name]) bypass[name] = board;
    if (!witness) witness = board;
    if (minimumPartitions <= V6_SIGNATURE_PARTITIONS) {
      const keys = semanticKeys(state, board);
      records.set(keys.origin, mechanismProfile(state, board, predicates, keys));
    }
    return true;
  });
  const reject = (reason, example = null) => ({ ...base, status: 'excluded', tier: null, board: null, nodes,
    features: { ...base.features, revision6Rejection: reason }, counterexample: example });
  if (counterexample) return reject('structural', counterexample);
  if (!enumeration.complete) return { ...base, status: 'limit', tier: null, board: null, nodes };
  if (!minimumPartitions) throw new Error('Revision-6 enumeration disagrees with minimum-R proof.');
  const certified = tier === 1 ? union : common;
  const family = priority.find((name) => certified.has(name));
  if (!family) return reject(tier === 1 ? 'easy-witness' : 'family');
  const board = tier === 1 ? easyWitnesses.get(family) : witness;
  const values = state.inventory.map((id) => Number(id.split('-')[1]));
  return { ...base, board, nodes, features: { ...base.features,
    proofNodes: nodes, rowsTouched: solutionStructure(state, board).changedRows,
    structure: { version: 2, proof: tier === 1 ? 'exact-easy-witnesses' : 'exhaustive-no-counterexample',
      partitions: enumeration.partitions, minimumPartitions, witness: solutionStructure(state, board) },
    family: { version: 1, primary: family, proof: tier === 1 ? 'existential-priority' : 'all-minimum-solutions',
      common: priority.filter((name) => common.has(name)), optional: priority.filter((name) => union.has(name) && !common.has(name)),
      eligibleWitnessKinds: tier === 1 ? EASY_PRIORITY.filter((name) => union.has(name)) : [], bypass },
    signatures: { version: 1, geometry, status: minimumPartitions <= V6_SIGNATURE_PARTITIONS ? 'complete' : 'truncated',
      sampledPhysicalPartitions: Math.min(minimumPartitions, V6_SIGNATURE_PARTITIONS),
      minimumSolutions: [...records].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
        .map(([origin, profile]) => ({ origin, profile })),
      boundary: [Math.min(...values) - 1, 13 - Math.max(...values)].sort((a, b) => a - b) },
  } };
}
