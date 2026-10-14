# Revision-6 family and difficulty specification

**Status:** Approved and implemented. Revision 6 is the fresh Start/Next and omitted-revision generation default; revisions 1–6 replay and saved sessions are preserved. Fixed draws, proof limits and bounded diagnostics are in the [generator contract](rummipuz-generator.md#revision-6--explicit-variety-generation-12-october-2026). Remaining browser/installed-offline acceptance is tracked in the [implementation plan](rummipuz-implementation.md).

## Tier contract

Use the existing physical tile inventory, row validity, preservation, minimum rearrangement `R`, connected changed-row components `C`, and non-endpoint count `N` defined in [the difficulty policy](rummipuz-difficulty.md). Preserve the current inclusive limits:

| Tier | Rack tiles | Starting rows | Exact minimum rearrangement | Additional revision-6 gate |
| --- | --- | --- | --- | --- |
| Easy | 2–5 | 2–5 | `R = 1` | At least one complete solution satisfies one of the three exact Easy predicates below. |
| Medium | 3–6 | 3–6 | `R = 2` | Every complete solution has a component with `C >= 2` and `N >= 1`. |
| Hard | 4–8 | 4–7 | `R = 3` | Every complete solution has a component with `C >= 3` and `N >= 2`. |
| Expert | 4–10 | 4–9 | `R >= 4` | Every complete solution has a component with `C >= 4` and `N >= 3`. |

For higher tiers, both thresholds must hold in the same component. Include all complete solutions, not just minimum-`R` solutions or the stored witness, and all physical-copy assignments. Expert still proves the exact minimum `R` before applying `R >= 4`. Reject zero-change, unsolvable, wrong-tier, out-of-bounds, and inconclusive candidates. A family label cannot award a tier.

## Exact Easy witness predicates

First validate a complete conserved final board, establish `R = 1`, and require the witness to change exactly one original row `S`. Every other original row must remain together in a separate final row of its original kind. That row may receive rack tiles as a valid extension; it must receive no tiles from `S` or another original row. No final row mixes tiles of `S` with tiles from any other original row. Final rows using only rack tiles are permitted and confer no mechanism credit.

All references to a core, cut, endpoint, or contribution concern the actual original physical IDs, not merely equal faces. The following alternatives are exhaustive for revision-6 Easy eligibility:

1. **`E-run-donation`.** `S` is a run. Retain exactly one contiguous original core of at least three tiles in a final run; any additions to that final run come only from the rack. Remove either one original endpoint, or exactly one tile from each end. Thus one or two original tiles are exported, with no interior extraction or longer exported fragment. Each exported tile enters its own final group containing that tile and two or three rack tiles of the other distinct colours. No other final row contains a tile of `S`. Both-end donation is a variant of this family, not a fourth Easy family.
2. **`E-group-donation`.** `S` is a four-colour group. Exactly three original tiles remain as an unchanged three-colour final group, with no added tiles. The fourth tile enters one final run containing it and at least two rack tiles of its colour, and no other board tiles. No other final row contains a tile of `S`. Breaking a three-colour group is excluded from Easy.
3. **`E-run-division`.** `S` is a run of length `L >= 4`. Choose one cut `k`, with `2 <= k <= L - 2`. Its original prefix of length `k` belongs entirely to one final run, and its suffix entirely to a different final run; each intersection with `S` is exactly that prefix or suffix. Both final runs have the original colour and length at least three; additions come only from the rack. At least one of these runs receives a rack tile. No original tile of `S` is exported to a group or third run. Overlapping final values require distinct physical copies. This admits the planned two-rack-copy example without allowing arbitrary one-row rebuilding.

Search for these witnesses independently of the solver's first answer. An elaborate answer cannot exclude a puzzle that has a qualifying simple witness. Conversely, `R = 1` or `N = 1` alone does not qualify. For Easy family accounting, enumerate which predicates have witnesses and choose the first present in the order above. Thus a division candidate with an available endpoint route counts as donation, not division. Group/run source kinds may differ between alternative witnesses; record all allowed witness kinds.

Easy eligibility is existential, as in revision 5; no universal bound on alternative elaborate solutions is introduced. The stricter export limit above applies only to revision 6; revision 5 retains its existing endpoint-only test. Review both-end donation for approachability, and reject/tune examples that feel like two independent chores.

## Family registry and catalogue disposition

`P` means a primary release family for the tier; `I` means investigate as an additional eligible family; `V` means a variant/supporting mechanism that cannot independently satisfy the tier or increase its family count; `—` means excluded from that tier's initial release. No `P` or `I` entry becomes eligible for generation before its fixture audit passes.

| Stable core family / catalogue entry | Easy | Medium | Hard | Expert | Investigation disposition |
| --- | --- | --- | --- | --- | --- |
| `run-donation`: one endpoint | P | V | V | V | Keep the introductory baseline; connect it to other changes only as supporting work at higher tiers. |
| Donation from both ends | V | V | V | V | Investigate within donation; explicitly cap Easy to one exported tile per end. Not an independent core family. |
| `group-donation`: four-colour group | P | I | I | I | New Easy fixture; investigate linked group donation and repair at higher tiers under the existing gates. |
| `run-division`: no interior export | P | V | V | V | New Easy fixture. Multirow versions fall under boundary repair or split/join where appropriate, not an automatically promoted Easy pattern. |
| `interior-extraction` | — | P | P | P | Develop connected run-only starts with interior tiles entering groups and valid surviving run fragments. Simple one-row interior extraction is deferred from Easy to keep its new policy narrowly specified. |
| `split-and-join` | — | P | P | P | Develop forced repair of short fragments through other changed source runs; retain the useful revision-5 Medium design. |
| `boundary-repair` | — | I | I | I | Investigated, but no qualifying Expert fixture emerged from bounded screening. Keep deferred as a possible future core; rejected examples have easier routes. Do not infer impossibility. |
| `groups-to-runs` | — | P | P | P | Investigate two-row conversion for Medium and larger connected group-only starts for Hard/Expert. Existing Expert duplicate-choice counts in this same family. |
| `runs-to-groups` | — | P | P | P | Investigate the reverse conversion, including short runs across colours. Do not assume that reversing a solved puzzle preserves its tier. |
| `mixed-exchange` | — | I | P | P | Use both conversion directions in a shared component with mixed starting rows; develop different repairs from the current Hard fixture. |
| Shared-set chains, branches, cycles | — | V | V | V | Investigate contribution topology inside the applicable core families. A different graph or supposed move order alone does not create a family. |
| `combined-repair`: different mechanisms | — | — | I | P | Accepted Expert replacement: necessary four-colour-group donation linked to necessary interior rebuilding of the same receiving run. The exact joint predicate is below. |

Primary release sets are therefore Easy's three explicit mechanisms; Medium's interior extraction, split/join, groups-to-runs, and runs-to-groups; Hard's same four plus mixed exchange; Expert's same five plus combined repair. Medium also has an audited optional mixed-exchange fixture. See the fixture review for the independent proofs, meaningful parameter changes, and the bounded boundary-repair investigation. Changing any further primary target requires the same explicit documentation and proof; silently lowering quotas or relabelling variants does not complete the step.

### Higher-tier mechanism predicates

For a complete solution, evaluate these predicates inside one component satisfying that tier's `C/N` gate. Ignore unrelated work elsewhere. Contributions below are intersections of original physical rows with final rows:

- **Interior extraction:** all source rows in the component are runs; a source run retains at least two distinct contiguous fragments of at least three original tiles each in different final runs, with an intervening original tile entering a group. No final run connects two changed source rows in that component. Shared final groups connect the sources.
- **Split/join:** all source rows in the component are runs; an original run contributes to at least two final rows, and a final run contains tiles from at least two changed source runs. At least one source remainder of one or two original consecutive tiles participates in such a shared run. A remainder is a contribution, not proof of a forced temporal move order. The fixture audit must establish that a disconnected repair or a no-join minimum solution cannot bypass this mechanism.
- **Boundary repair:** all source rows in the component are runs; all their original tiles finish in runs, with at least one final run sharing changed origins. At least one changed source contributes to two final runs. No source tile in that component enters a group. This distinguishes it from run-to-group extraction and the initial split/join family. For classification, a boundary repair satisfying the short-remainder split/join predicate is assigned split/join first.
- **Groups-to-runs:** all source rows in the component are groups, and all their tiles finish in runs. Unchanged rows outside the component may be of either kind. Differences in the number of consecutive groups and extra duplicate runs are variants of this core.
- **Runs-to-groups:** all source rows in the component are runs, and all their tiles finish in groups. Short surviving runs would instead require a different certified family. This is deliberately distinct from interior extraction with retained run fragments.
- **Mixed exchange:** the same qualifying component contains both original groups and runs, at least one original group tile finishes in a run, and at least one original run tile finishes in a group. Both directions are present in each solution being certified; donating a group tile without the reverse exchange is insufficient.
- **Linked group donation (`I`):** a changed four-colour group retains exactly three original tiles together in a group, exports the fourth to a run, and joins the qualifying component through that run's contribution from another changed source. It is not counted as ordinary pure group conversion. Mixed exchange takes precedence over linked-only donation; combined repair takes precedence over both when its extra joint requirements are necessary.
- **Combined repair:** in one qualifying component, a changed four-colour group retains exactly three original tiles as a final three-colour group with no added tiles and donates its fourth tile to a final run containing tiles of a changed source run `S`. That same `S` retains at least two distinct contiguous original cores of at least three tiles each in separate final runs, with an intervening original tile finishing in a group. The receiving run can contain a short contribution from `S`; the two long cores can survive elsewhere. Both donation and interior rebuilding, and their link through the same `S`, must exist in every minimum-`R` solution. This is more specific than ordinary mixed exchange and has priority over it. Generic exchanges without these retained cores and retained three-colour group do not qualify. Longer source fragments can admit multiple completions without removing either necessary idea.

### Necessary mechanisms and one primary label

For Medium–Expert, examine **every solution attaining the exact minimum `R`** for family certification, in addition to the separate all-solution tier proof. For each solution collect the predicates present in its qualifying components. A core is certified only if its predicate is present in every minimum-`R` solution. The component containing it may differ between solutions. Record the common predicates, optional predicates, and a bypass witness for each attempted but non-common predicate.

Choose exactly one primary label from the common set, in this stable priority order: combined repair, mixed exchange, linked group donation, groups-to-runs, runs-to-groups, interior extraction, split/join, boundary repair. If there is no common recognised core, the candidate does not count as a new family and is ineligible for the initial revision-6 release. Candidates from different construction functions with the same certified primary label count together. This conservative rule may reject legitimate puzzles with different minimum-solution mechanisms; broader coverage can be separately specified after the initial release.

Required family certification must be exhaustive or follow a sound independently checked construction proof that holds for the actual parameterised inventory. Inconclusive certification cannot publish a family-tagged candidate. Runtime budgets and traversal for this additional work are fixed during the implementation step after fixture costs are known; do not invent elapsed-time cutoffs. Human review still decides whether two certified cores feel meaningfully different.

## Parameter and overlay eligibility

For each accepted fixture, the next step must specify allowed parameter ranges rather than assume they preserve its proof: source run lengths, cut/extraction positions, gap/overlap widths, group colour counts, number of linked sources, rack contributions, and duplicate-face allocation. All faces remain within 1–13 and the two-copy inventory. Added rows and tiles require a fresh proof.

Investigate all overlays from the catalogue: asymmetric lengths and repairs; 1/13 boundary cases; run-only/group-only/mixed starts; linear/branching/cyclic contribution; duplicate allocation; overlapping values/colours; scarce-tile competing uses; initially legal but incompatible rack placements; unique and multiple completions; varying rack/row sizes. Record each as accepted, rejected with a counterexample, or deferred with a concrete reason in the fixture review. None adds to the core-family quota on its own.

For an initial useful-choice review, include at least one audited duplicate-allocation case and one competing-placement case in both Hard and Expert, and both unique and multiple face-level completions somewhere across Medium–Expert. These are fixture/review coverage requirements, not per-puzzle difficulty gates or requirements to add clutter to every puzzle. Count distinct face completions separately from physical-copy permutations. If an overlay has no useful construction within current bounds, record the evidence and revise this review requirement explicitly.

Unchanged support rows are permitted to meet minimum row counts or supply genuinely competing placements. Describe their purpose. Direct rack extensions, standalone rack sets, and merging intact rows give no extra difficulty or family credit. Same-value exchanges without a necessary repair are excluded as a standalone core. Jokers and new gameplay/UI features remain deferred.

## Semantic signature contract

Keep separate keys; no single face-layout count measures all variety:

1. **Starting geometry key.** Replace IDs by faces while retaining multiplicity. For each of the 24 colour permutations and both orientations (`v` or `14-v`), translate all values so the inventory minimum is 1. Encode each original row as its kind plus ordered run faces or sorted group faces; sort the row encodings, and sort rack faces. Use the lexicographically smallest encoding of `[rows, rack]` over those 48 transforms. Use ASCII order and a fixed schema, not locale sorting. This key ignores row/group order and cosmetic copy labels, but retains relative gaps, run lengths, group sizes, board/rack separation and duplicate multiplicity.
2. **Origin-aware solution key.** Canonicalise the starting board and solution jointly using the same colour/value transform. Give original rows indices in sorted starting-row order; enumerate index assignments within tied identical row encodings and choose the smallest joint encoding. Label each final physical tile by transformed face and origin (original-row index or rack). Sort final group tiles and final rows; retain numerical run order. Encode the canonical starting geometry plus these final rows, using the smallest joint encoding. Copy numbers are omitted only from the key: actual proof still distinguishes IDs. Origin labels retain allocation of equal faces from different source rows. Swapping copies of a face is cosmetic only when the full joint incidence is equivalent.
3. **Mechanism profile.** Record the certified primary family, common/optional predicates, changed-origin kinds, component sizes and non-endpoint counts, source-to-final contribution graph, splits/joins, and direction of conversion. Counts/lengths/topology supplement a family, not automatically create one. Canonicalise graph vertex order with the origin-aware key; explicitly named counts must not depend on which first witness the solver returned.

For small fixtures, record the set of origin-aware keys and mechanism profiles for **all minimum-`R` solutions**. For generation diagnostics, required core certification remains exhaustive; full key-set collection may use a separately bounded diagnostic pass, with `complete` versus `truncated` reported. Truncated key sets cannot establish uniqueness or absence of optional mechanisms. Signature collection must not silently alter accepted replay outputs by using a device-dependent budget.

Also record an unnormalised boundary profile: distance of the inventory's minimum/maximum to 1/13, with orientation treated consistently. Translation-equivalent starting geometry can differ in available outside neighbours; this profile keeps useful boundary variation visible without falsely declaring a new core family. Record physical partition counts separately from face-level solution counts.

The canonical definition above is semantic, not a requirement to use factorial brute force in the runtime. Any faster tie/graph canonicalisation must be checked against the definition on small fixtures. Never erase duplicate multiplicity or original provenance as an optimisation for the difficulty proof.

## Fixed release gates

Use the quotas below for revision-6 release. Fixtures must support them before implementation; these are not current revision-5 measurements.

| Tier | Minimum certified core families | Maximum share of one family | Required starting-board composition |
| --- | --- | --- | --- |
| Easy | 3 | 50% | Run-only and mixed each >= 20%; starts containing a group >= 20%. |
| Medium | 4 | 40% | Run-only and mixed each >= 20%; group-only investigated, without a minimum quota. |
| Hard | 5 | 35% | Run-only, mixed, group-only each >= 10%; none > 60%. |
| Expert | 6 | 35% | Run-only >= 20%; mixed >= 40%; group-only >= 10% and <= 30%. |

Each required core must account for at least 5% of accepted outputs in its tier. A composition refers to **all starting rows**: run-only means every row is a run; group-only every row is a group; mixed includes both. Also report composition of the changed component so unchanged filler cannot mask repetition. Minimum integer counts use `ceil(p * n)` and maximum counts `floor(p * n)`; equality at an integer bound passes.

Predeclare two independent seed blocks before tuning: `variety-v6-dev-0` through `variety-v6-dev-255`, and `variety-v6-holdout-0` through `variety-v6-holdout-255`, separately for each tier with full revision-6 identities. Each block requests exactly 256 puzzles per tier. Each block must independently produce all 256 ready outputs and pass the quotas. Record every exhausted/error/cancelled request; no replacement seeds, omitted failures, pooling between blocks, or optional-family aliases. Deliberate cancellation tests run separately. If a block fails, fix the implementation and rerun the entire named block with documented changes; do not search for a favourable seed list. The holdout is a fixed second coverage check, not a claim of statistical independence from developer inspection.

Report per-family attempt/rejection counts, shared proof-node cost, readiness/failure rate, accepted frequencies, structural/geometry key frequencies, boundary/overlay coverage, duplicate/rack/row/length ranges, alternative mechanisms, and longest family streak. Define diagnostic sequences as the 16 consecutive non-overlapping groups of 16 seeds in each block and tier. Present several of those sequences in human review; generation remains independent of session history. No guarantee of never repeating adjacent families is introduced.

Require desktop and tablet timing/interaction evidence later, including per-tier and per-family median/p95/max preparation times and slow outliers. No fixed millisecond threshold is invented in this specification; compare with recorded revision-5 device performance and review responsiveness before release. Browser unavailability does not block this specification or native fixture audits, but cannot be treated as device-performance verification.

## Fixture deliverables — complete

For every primary tier/family pairing, include a conserved hand solution, exact minimum `R`, all-solution tier proof, minimum-solution family certification, semantic keys/profiles, parameter ranges to investigate, and simpler-route counterexamples. Include meaningful parameter variants and prove each supplied inventory independently.

Complete the disposition ledger for catalogue entries and overlays, including optional `I` entries and concrete reasons for any deferred designs. Fixture completion does not implement a generator, publish replay codes, certify device speed, or switch the default. Runtime algorithms, draw ordering, retry/proof budgets and offline changes belong to the subsequent implementation step.

The approved inventory is embedded in `app/patterns-v6.js` and the independent fixture audit can be reproduced with `python3 plans/checks/review_v6_patterns.py`. All primary pairings have proofs; the optional Hard combined design is rejected for having `R = 4` and independently accepted as a compact Expert variant. Runtime implementation, accepted-output/device verification, and family/sequence user review are complete. Revision 6 is the fresh-puzzle default.
