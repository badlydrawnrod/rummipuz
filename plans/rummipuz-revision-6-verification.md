# Revision-6 variety and preparation verification

**Status:** Phase 7 variety/preparation verification complete on 12 October 2026. Both full tuned native blocks and laptop/tablet reruns pass every quota with no failed requests; the user confirmed both devices stayed responsive. Required physical/semantic audits and regressions pass. Revision 5 remains the default. Family/sequence user review and Phase 5 whole-session/installed-offline acceptance remain separate. No commit or agent-side browser use.

## Initial laptop run — preparation succeeds, composition quotas fail

The user supplied the diagnostic summary for Lenovo Laptop, Firefox 157.0 on Linux x86_64. Both fixed blocks completed: all 2,048 requested puzzles were ready, no errors or cancellation, 5,677 timer heartbeats. Loaded and expected offline release were `v4`, with no waiting update. Exact supplied evidence is retained in [revision-6-laptop-initial.json](revision-6-laptop-initial.json). No scrolling/interaction observations or full per-request download were supplied.

Easy and Medium pass every reported gate in both blocks. Hard and Expert meet the family requirements but fail the starting-board group-only minimum of 26 outputs per block:

| Block | Hard group-only / 256 | Expert group-only / 256 | Required minimum |
| --- | --- | --- | --- |
| Development | 23 | 22 | 26 |
| Holdout | 20 | 20 | 26 |

These are composition failures, not generation failures. The current uniform variant choice within groups-to-runs selects mixed support-row designs as well as group-only designs; the family share alone cannot meet the composition quota. Do not mark the step complete or relax the quotas. After reviewing the pending tablet run, tune the construction mix and rerun both complete named blocks, preserving this initial evidence and documenting any replay-contract consequences. No tuning has been made while the tablet run is pending.

| Tier | Development median / p95 / max (ms) | Holdout median / p95 / max (ms) |
| --- | --- | --- |
| Easy | 61 / 79 / 140 | 47 / 65 / 70 |
| Medium | 64 / 81 / 101 | 52 / 65 / 87 |
| Hard | 89 / 180 / 295 | 73 / 159 / 182 |
| Expert | 365 / 818 / 1,063 | 340 / 657 / 932 |

Expert is materially slower than the recorded revision-5 desktop preparation (23–32 ms tier medians and 87 ms maximum on the prior user-reported run). Its interior, split/join and combined-repair diagnostics deserve review with the tablet timings. Native timer progress and browser heartbeat counts do not establish interaction comfort; obtain user observations before accepting device responsiveness.

## Initial tablet run — preparation succeeds, same quota failures

The user reported “Tablet chrome” on 12 October 2026; exact model was not supplied. The provided user-agent string reports Linux x86_64 and Chrome 154.0.0.0, including a pasted link around the version. Preserve this as user-labelled tablet evidence without inferring hardware. [revision-6-tablet-initial.json](revision-6-tablet-initial.json) retains the complete supplied summary.

Both fixed blocks prepared all 2,048 outputs with no errors/cancellation. Loaded release was `v4`, with no waiting update, and 6,267 timer heartbeats. All reported family/composition counts and failed gates agree with laptop and native generation. Hard/Expert group-only counts are 23/22 (development) and 20/20 (holdout), below 26. No user scrolling/interaction observations were supplied.

| Tier | Development median / p95 / max (ms) | Holdout median / p95 / max (ms) |
| --- | --- | --- |
| Easy | 96.9 / 124.2 / 400.8 | 97.6 / 126.7 / 142.8 |
| Medium | 100.2 / 124.9 / 142.7 | 97.7 / 122.9 / 160.3 |
| Hard | 118.6 / 198.0 / 241.4 | 119.9 / 190.2 / 241.4 |
| Expert | 309.4 / 527.0 / 2,260.6 | 286.8 / 477.8 / 596.9 |

The Expert maximum is an isolated slow request requiring post-optimisation device review. The prior revision-5 tablet medians were 65.6–91.8 ms, with 615.5 ms maximum; the initial revision-6 run is slower in every tier, with a much larger Expert outlier. This comparison is observational across runs, not a fixed time threshold.

## Authorised pre-release tuning

On 12 October 2026, the user explicitly chose: “Retune unreleased revision 6; allow its current replay layouts to change.” This authorises changing the revision-6 mix during this verification step. Revisions 1–5 remain exact and revision 5 remains the fresh-puzzle default. Existing saved revision-6 sessions still resume from their saved immutable starting layouts; regenerating an early revision-6 code can now produce a different layout. No storage migration or active-session replacement is performed.

The initial native run completed both prescribed blocks with all 2,048 ready outputs and the same four group-only quota failures. Every worker output matched a separate direct generation. Full per-request accounting, semantic-key frequencies, sequences and timings are preserved in [revision-6-native-initial.json](revision-6-native-initial.json). Long semantic strings are represented by SHA-256 of the exact canonical encoding, separately from family labels; complete/truncated statuses remain explicit. The original full native data were written to `/tmp/rummipuz-v6-performance-x1IRHB`.

Tuning increases Hard groups-to-runs to 26% and gives its group-only inventory an 8:1:1 variant weighting, yielding a proposed group-only share of 20.8%. Expert groups-to-runs increases to 20%, with two pure-group inventories weighted 2 each and its mixed duplicate variant 1, yielding a proposed group-only share of 16%. Expert's proposed run-only/mixed split has ample margin above the respective 20%/40% floors. These are design expectations; both full named blocks must independently pass observed quotas. No favourable seeds are substituted and no quota is lowered.

A semantics-preserving canonicalisation optimisation prepares all 48 starting transforms once per puzzle and retains every tied geometry-minimal transform. Because joint solution encodings compare starting geometry first, other transforms cannot yield the minimum joint encoding. All tied original-row assignments remain enumerated. Every fixture's runtime geometry, origin-aware keys and mechanism profiles agree with the independent literal oracle. Required physical enumeration, tier/family proofs, traversal, diagnostic cap and shared proof budget remain unchanged.

Offline release increments to `v5` with the same 39 assets. All 1,284 native checks pass, including 17 new diagnostic-accounting/quota-boundary checks and all 60 focused precache-only worker checks. Tuned revision-6 golden fixtures have been regenerated under the explicit authorisation; old revision-2/3/4/5 goldens remain unchanged. Both complete tuned blocks and the separate determinism pass are underway. Desktop/tablet reruns and responsiveness observations are required before checking the plan item complete. No commit or agent-side browser use.

## Tuned laptop rerun — all quotas pass

The user supplied the Lenovo Laptop / Firefox 157.0 rerun on 12 October 2026. Both fixed blocks pass every reported gate: all 2,048 requested puzzles were ready, with no failures or cancellation. Release `v5` was loaded and expected, with no waiting update; 2,741 timer heartbeats were recorded. Exact supplied evidence is retained in [revision-6-laptop-tuned.json](revision-6-laptop-tuned.json).

| Tier | Development median / p95 / max (ms) | Holdout median / p95 / max (ms) |
| --- | --- | --- |
| Easy | 39 / 45 / 81 | 44 / 50 / 95 |
| Medium | 46 / 53 / 85 | 50 / 62 / 92 |
| Hard | 54 / 97 / 124 | 58 / 99 / 141 |
| Expert | 89 / 290 / 458 | 90 / 233 / 480 |

Expert median preparation fell from 340–365 ms to 89–90 ms; its maximum fell from 1,063 ms to 480 ms. All tiers improved on this laptop run. This is successful desktop quota/preparation evidence; no scrolling/interaction observations were supplied. The tuned tablet rerun and responsiveness observations remain pending, so the overall plan item remains unchecked. No further runtime tuning was made after this laptop result, and no commit was made.


## Tuned tablet rerun and interaction review — pass

The user supplied the tablet Chrome rerun on 12 October 2026. Both fixed blocks pass all reported gates: all 2,048 requested puzzles were ready, with no failures or cancellation. Release `v5` was loaded and expected, with no waiting update; 4,413 timer heartbeats were recorded. Exact evidence is retained in [revision-6-tablet-tuned.json](revision-6-tablet-tuned.json). The user explicitly confirmed **both laptop and tablet stayed responsive**, including during slower requests.

| Tier | Development median / p95 / max (ms) | Holdout median / p95 / max (ms) |
| --- | --- | --- |
| Easy | 85.3 / 107.6 / 249.4 | 85.7 / 111.6 / 144.9 |
| Medium | 90.4 / 112.0 / 601.8 | 87.9 / 113.1 / 386.9 |
| Hard | 99.9 / 139.3 / 1160.3 | 96.7 / 131.9 / 168.0 |
| Expert | 125.9 / 296.8 / 423.8 | 127.5 / 253.5 / 418.3 |

Expert tablet medians fell from 286.8–309.4 ms to 125.9–127.5 ms, and its maximum from 2,260.6 ms to 423.8 ms. Medians remain above revision 5's 65.6–91.8 ms range; the broader proof/certification work costs more, but the observed responsiveness and zero-failure runs support preparation acceptance without inventing a fixed time cutoff.

The isolated Hard development outlier (`rummipuz:1:6:3:variety-v6-dev-223`) took 1,160.3 ms on tablet. It is a groups-to-runs candidate requiring only 254 proof nodes, and the same native worker request took 87.6 ms. Hard's next-slowest tablet development request was 167.1 ms; holdout maximum was 168.0 ms. This is not a reproducible high-proof-cost case in the recorded evidence. Its precise cause is unknown; no request was omitted or replaced, it succeeded, and the user reported no interaction pause. Medium also recorded an isolated 601.8 ms development maximum. These outliers remain in the timings and full device summaries.

## Tuned native blocks — both pass

Both complete prescribed blocks ran sequentially through fresh actual module workers: 256 outputs per tier per block, 2,048 requests total. Every request succeeded on attempt one; no exhaustion, proof limit, error, cancellation or substituted seed occurred. Each complete block independently meets every integer quota, all primary families exceed the 13-output minimum, and every audited inventory appeared across the run (36 patterns). The separately timed direct pass matched every complete worker result exactly.

Evidence is retained in [revision-6-verification.json](revision-6-verification.json): all request identities, accepted frequencies, attempts/rejections, per-family proof/timing distributions, composition including changed origins/components, boundary/duplicate/size overlays, canonical semantic-key frequencies, longest streaks, and all 16 fixed groups of 16 seeds per tier/block. Keys are SHA-256 of exact canonical JSON strings; they are not raw face-layout counts. The native originals are in `/tmp/rummipuz-v6-performance-rWp1Si`; regenerate with `node plans/checks/benchmark_v6_native.mjs` and compact with `python3 plans/checks/summarize_v6_native.py <native-directory> <output-json>`.

Native environment: Linux x64, Intel Core i7-8565U @ 1.80 GHz, Node modules/worker threads. Measurements include worker startup, imports, generation/proofs, result transfer and freezing, without discarded warmups. The separate direct pass excludes worker startup. These native timings are distinct from the device results above. A 10 ms timer recorded 19,705 heartbeats across native worker and direct passes; browser interaction acceptance comes from the user's explicit observation.

| Block | Tier | Families | Run-only / mixed / group-only starts | Longest family streak | Geometry keys |
| --- | --- | --- | --- | --- | --- |
| dev | 1 | 3 | 160 / 96 / 0 | 6 | 6 |
| dev | 2 | 5 | 160 / 96 / 0 | 5 | 9 |
| dev | 3 | 5 | 118 / 81 / 57 | 4 | 9 |
| dev | 4 | 6 | 90 / 127 / 39 | 4 | 12 |
| holdout | 1 | 3 | 160 / 96 / 0 | 5 | 6 |
| holdout | 2 | 5 | 141 / 115 / 0 | 4 | 9 |
| holdout | 3 | 5 | 116 / 92 / 48 | 4 | 9 |
| holdout | 4 | 6 | 84 / 143 / 29 | 4 | 12 |

Family/composition counts and proof-node distributions agree exactly between native, laptop and tablet summaries. Native timing and proof costs per block:

| Block | Tier | Worker median / p95 / max (ms) | Proof nodes median / p95 / max |
| --- | --- | --- | --- |
| dev | 1 | 57.2 / 62.7 / 72.3 | 60 / 240 / 241 |
| dev | 2 | 64.4 / 74.2 / 82.7 | 181 / 418 / 519 |
| dev | 3 | 77.2 / 111.6 / 138.5 | 391 / 2204 / 4242 |
| dev | 4 | 121.1 / 358.5 / 542.1 | 784 / 9147 / 16146 |
| holdout | 1 | 70.2 / 77.3 / 80.9 | 60 / 240 / 241 |
| holdout | 2 | 74.4 / 83.0 / 88.5 | 168 / 407 / 489 |
| holdout | 3 | 86.2 / 130.5 / 202.8 | 406 / 2313 / 4242 |
| holdout | 4 | 143.3 / 393.2 / 576.2 | 784 / 7310 / 16020 |

The maximum shared proof cost was 16,146 nodes, below the unchanged 200,000-node allowance. Per-family analysis confirms split/join and long combined repairs carry the largest proof costs; interior extraction also costs more diagnostic work despite fewer proof nodes. The exact median/p95/max and attempted-node totals for each tier/family/block remain in the evidence JSON. No proof budget, tier gate or diagnostic cap was weakened to pass.

## Variety and limits

Coverage now comprises Easy's three certified families, Medium's four primaries plus optional mixed exchange, Hard's five primaries and Expert's six. All 36 finite inventories appear; recolouring/copy labels do not add families. Starting-geometry keys number 6/9/9/12 by tier in each block: this demonstrates the finite noncosmetic envelope, not unlimited structural variety. Adjacent same-family repeats remain possible; observed maximum streaks are six in Easy, five in Medium, and four in Hard/Expert. The 16 fixed consecutive sequences per tier/block are available for the next user-review step.

Changed-origin composition is reported separately: e.g. Medium's group conversion can start mixed because of support rows, while its changed core is group-only. Expert group conversion likewise has mixed duplicate variants without becoming a mixed-exchange family. This distinction prevents filler from earning mechanism credit. Rack ranges are Easy 2/4, Medium 3–5, Hard 4/6/7, Expert 5–8; initial row counts are 2, 3, 4–5, 4–5. Duplicate counts, run/group lengths, competing placements and boundaries are recorded per request and aggregated separately. They are overlays, not extra core labels.

All Easy/Medium/Hard semantic key sets are complete. Expert has 34 development and 32 holdout truncated sets because its 64-minimum-partition diagnostic cap is retained; no uniqueness/absence claim uses them. Required family common/optional predicates and all-solution tier gates are exhaustive regardless of diagnostic status. Higher tiers report no optional minimum-solution predicate in these sampled inventories. Easy's non-common witness predicates retain their existential interpretation. Independent full face-partition evidence is recorded separately from physical-copy and origin-key counts.

## Independent generated-output audit

An independent Python audit examined **all 2,048 tuned outputs and 26,994 complete physical partitions**, using both mask and plain set-cover enumeration paths. They agree on every complete partition set. Exact minimum `R`, universal structural gates, common/optional minimum-solution mechanisms, complete conserved witnesses and runtime physical partition counts all agree. Full request-level evidence, including face completion counts, dead initially legal placements and duplicate-origin alternatives, is retained in [revision-6-generated-audit.json](revision-6-generated-audit.json). This full pass omits expensive semantic-key collection; semantic equivalence is checked separately on the 36 audited inventories and one actual transformed output per inventory.

| Tier | One face completion | Multiple face completions | Face completion range | Outputs with incompatible preserved rack placement | Outputs with duplicate allocation alternatives |
| --- | --- | --- | --- | --- | --- |
| Easy | 512 | 0 | 1 | 0 | 254 |
| Medium | 455 | 57 | 1–2 | 201 | 0 |
| Hard | 416 | 96 | 1–4 | 220 | 253 |
| Expert | 231 | 281 | 1–18 | 127 | 317 |

These are complete face-level counts from the independent oracle, distinct from physical-copy partitions and bounded origin-aware diagnostic keys. Unique/multiple completions, duplicate allocation and competing placements are present where specified without becoming separate families or tier gates.

Reproduce the full audit with:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 plans/checks/verify_v6_generated.py <native-directory>/samples.json --no-signatures --output plans/revision-6-generated-audit.json
```

The original 36 fixture canonical results agree with the literal independent oracle after the optimisation. A separate transformed-output audit collects full literal semantic evidence for one generated representative of each inventory, while checking the runtime's complete/bounded key/profile records. No claim of uniqueness or missing optional mechanisms is based on truncated runtime diagnostics.


The 36 actual transformed representatives passed full independent semantic audit across **757 physical partitions**, including every geometry key, bounded/full origin key and mechanism profile; evidence is in [revision-6-signature-audit.json](revision-6-signature-audit.json). Required audits, all 1,284 native regression checks, both independently passing quota blocks and both responsive device runs complete this plan item. The next step is user review of every family and short same-tier sequences. Revision 5 remains default until that approval; no commit was made.
