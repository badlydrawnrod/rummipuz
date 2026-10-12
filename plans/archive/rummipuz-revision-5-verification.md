# Revision-5 correctness, variety, and preparation verification

> Historical record archived on 12 October 2026. Status, next-step instructions and release numbers below describe the work at the time. Use the [current implementation plan](../rummipuz-implementation.md) for remaining work.

**Status:** Phase 6's fourth step is complete. Native verification and the user-reported desktop and tablet preparation runs passed. The desktop rerun passed after loading offline release `v2`. This report records the pre-release preparation verification. Generated samples have since been approved and revision 5 is now the default; see the [generation contract](../rummipuz-generator.md#approved-default-switch--11-october-2026) for the subsequent release-`v3` checks.

## Native sample and correctness

Tested `rummipuz:1:5:<tier>:verify-v5-<index>` for all four tiers and indices 0–63: 256 sequential requests through the actual module-worker service, each with a fresh native worker. Every request succeeded on attempt one; no generation exhaustion, worker error, or incorrect replay identity occurred. Each worker result matched two direct deterministic generations. The independent Python physical-tile oracle audited all 256 generated inventories and 3,024 complete partitions, with no easier structural counterexample. Easy's endpoint-only witness rule and each higher tier's universal structural gate passed.

All 851 native checks passed, including the unchanged revision-2/3/4 golden replay fixtures, conservation, rejected alternative solutions, proof limits, worker cancellation/retry, play-flow preservation, and offline package/lifecycle checks. Ten new benchmark checks cover failure accounting, timings, cancelled/partial runs, invalid identities, and empty summaries. No application runtime files changed for this verification step; offline release `v2` and its 33 runtime resources remain unchanged. The new check pages are diagnostic assets outside the precache, like the existing checks page.

## Timing evidence

Environment: Linux x64, Intel Core i7-8565U @ 1.80GHz, native modules and Node worker threads through `node_repl`. These are **not browser or tablet timings**. The worker measurement includes construction, loading/imports, generation, proof, message delivery, and service result freezing. Direct measurements exclude worker startup and were made separately on the same runtime. No warm-up requests were removed; the sample ran Easy through Expert in order. Timing is observational and host load can affect it; it is not an automated pass/fail threshold or a replay input.

| Tier | Ready / requested | Failure rate | Worker median / p95 / max (ms) | Direct median / p95 / max (ms) |
| --- | --- | --- | --- | --- |
| Easy | 64 / 64 | 0% | 47.6 / 53.8 / 106.1 | 2.1 / 3.3 / 6.0 |
| Medium | 64 / 64 | 0% | 52.1 / 55.2 / 56.2 | 4.0 / 4.9 / 5.9 |
| Hard | 64 / 64 | 0% | 54.3 / 58.2 / 61.4 | 5.5 / 7.0 / 7.3 |
| Expert | 64 / 64 | 0% | 59.7 / 88.9 / 109.1 | 7.8 / 46.8 / 50.0 |

A 10 ms main-thread timer fired 1,522 times during the run. This confirms native timer progress, not browser scrolling, rendering, or touch responsiveness. Sampled proof costs and worker startup are acceptable on this native host; device results are still needed. Zero failures in 64 seeds per tier is not a guarantee for all devices or seeds.

Full per-request timings and family counts are in [revision-5-verification.json](../revision-5-verification.json).

## Variety evidence and limits

| Tier | Sampled families | Unique face layouts / 64 | Rack sizes | Original row counts |
| --- | --- | --- | --- | --- |
| Easy | Endpoint baseline: 64 | 54 | 2 | 2 |
| Medium | Interior splits: 34; split and join: 30 | 46 | 4 | 3 |
| Hard | Group/run exchange: 37; groups to runs: 27 | 54 | 4, 7 | 4 |
| Expert | Duplicate choice: 26; four-group chain: 38 | 60 | 6 | 4, 5 |

Face-layout counts ignore physical copy labels, rack order, original row order, and group colour order, but retain colours and values. Consequently recolouring, translating, and reflecting can produce a distinct face layout without introducing a new reasoning pattern. The seven families were all exercised. Medium and Hard have different mechanisms; Expert's two variants share a group-conversion core, with the duplicate variant adding origin-sensitive solutions. Easy intentionally keeps one teaching pattern. Repeated layouts across different seeds are allowed; seed freshness does not guarantee structural uniqueness.

This verifies the intended initial pattern coverage, not unlimited variety or measured human difficulty. The limited family set, particularly Expert, must be considered in the subsequent user sample review. No generator tuning or default change was made during this step.

## Reproduce and finish device verification

With the usual static server running, open `/checks/revision-5-performance.html` on desktop and tablet. Enter the device and browser, select **Run check**, and keep the page visible. It runs the same 256 identities sequentially through browser module workers, reports success/failure counts and timing percentiles by tier, and supports stopping and downloading full results. It neither reads nor changes the game session, progress, settings, or default generator. Check scrolling and interaction while workers prepare puzzles. Share each summary and note pauses, failures, device/browser versions, and whether the run was interrupted or backgrounded. A stopped run is partial and does not complete acceptance. Desktop and user-reported tablet preparation runs completed successfully. The summaries do not establish touch comfort or all gameplay/visual flows, which remain in the separate whole-session verification.

Optional native reproduction, on a machine with Node available:

```bash
node plans/checks/benchmark_v5_native.mjs
```

The script stages modules in a temporary directory without adding build dependencies to the app. It prints that directory and summary, and writes `verification.json` and full `samples.json` there. Independently audit those samples with:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 plans/checks/verify_v5_generated.py /path/from/benchmark/samples.json
```

The recorded run used this measurement logic through the available native runtime; a terminal Node installation is not required for ordinary game launch or browser checks. The successful desktop and user-reported tablet measurements are recorded below. Both preparation results have been reviewed and Phase 6's fourth item is checked.

## Initial desktop failure — resolved by successful rerun

On 11 October 2026, the user reported Lenovo Laptop, Firefox 156.0 on Linux x86_64. The run was not cancelled, recorded 75 timer heartbeats, and completed 256 requests with zero ready puzzles: 64 failures per tier (100%). All successful-preparation timing fields were null. These are failed preparation results, not browser performance measurements.

The first record's error was `Unsupported or malformed rated generation identity.` That is the pre-revision-5 rated-generator validation message; current valid revision-5 requests dispatch to a separate module before that check. The browser loaded older generator code. The previous service-worker cache is the likely cause; wrong server content is another possibility if a cache update does not resolve it. Actual loaded cache release has not yet been reported.

The diagnostic now exposes grouped errors, the first affected replay identity, loaded versus expected offline release (`v2`), and whether an offline update is waiting. Thirteen benchmark checks pass after these diagnostic changes. Close all Rummipuz tabs/windows, reopen the game to allow its update to install, follow any waiting-update notice by closing/reopening again, and rerun the desktop diagnostic. Existing progress/settings are retained; no forced worker activation or storage clearing was introduced. If failure persists with loaded release `v2`, collect the new error summary and check that the server serves the current project. The successful desktop rerun and subsequent tablet result below resolve this preparation-verification requirement.

## Desktop rerun — passed

On 11 October 2026, the user supplied a completed Lenovo Laptop / Firefox 156.0 run on Linux x86_64: 256 requested, 256 ready, no errors, and 154 timer heartbeats. Loaded and expected offline releases both reported `v2`, with no waiting update. This resolves the earlier older-module failure and supports the stale-release diagnosis. All family counts exactly match the fixed-seed native sample.

| Tier | Ready / requested | Failures | Median / p95 / max (ms) | Families |
| --- | --- | --- | --- | --- |
| Easy | 64 / 64 | 0 | 23 / 29 / 87 | Endpoint baseline: 64 |
| Medium | 64 / 64 | 0 | 27 / 30 / 30 | Interior splits: 34; split and join: 30 |
| Hard | 64 / 64 | 0 | 29 / 33 / 64 | Group/run exchange: 37; groups to runs: 27 |
| Expert | 64 / 64 | 0 | 32 / 55 / 61 | Duplicate choice: 26; four-group chain: 38 |

Preparation times are acceptable for the sampled desktop run: tier medians are 23–32 ms and every request completed within 87 ms. Timer progress confirms that the page's timer ran during preparation; the summary does not independently establish scrolling/touch comfort or the absence of perceived pauses. No such observations were supplied. Tablet preparation results were subsequently received and reviewed below.

## User-reported tablet run — passed

On 11 October 2026, the user supplied the tablet result labelled **Lenovo ThinkPad, Chrome**, with a Linux x86_64 user agent identifying Chrome 154.0.0.0. The run was not cancelled: 256 requested, 256 ready, no failures, and 421 timer heartbeats. All seven family counts exactly match the native and desktop samples. This records the device category as reported by the user; the user-agent string does not independently verify touch hardware. Cache-release fields were not included in this summary, but successful revision-5 generation demonstrates that the older-code failure did not affect this run.

| Tier | Ready / requested | Failures | Median / p95 / max (ms) | Families |
| --- | --- | --- | --- | --- |
| Easy | 64 / 64 | 0 | 65.6 / 87.1 / 615.5 | Endpoint baseline: 64 |
| Medium | 64 / 64 | 0 | 78.2 / 95.2 / 97.7 | Interior splits: 34; split and join: 30 |
| Hard | 64 / 64 | 0 | 75.8 / 96.1 / 106.0 | Group/run exchange: 37; groups to runs: 27 |
| Expert | 64 / 64 | 0 | 91.8 / 135.1 / 151.1 | Duplicate choice: 26; four-group chain: 38 |

Typical sampled preparation takes 66–92 ms, with tier p95 values below 136 ms. Easy has an isolated 615.5 ms maximum despite a 65.6 ms median and 87.1 ms p95; its cause cannot be determined from the summary. All requests still completed, and timers progressed during the run. This is acceptable for asynchronous puzzle preparation with the existing loading/cancellation controls; it does not establish a strict latency guarantee or prove the absence of perceived pauses. Retain the outlier as an observation for later sample/play review rather than alter deterministic generation based on wall-clock timing.

The combined evidence satisfies this step's correctness, initial variety coverage, and desktop/tablet preparation-performance requirements: 256 native samples, 256 successful desktop samples, and 256 successful user-reported tablet samples, alongside exhaustive independent alternative-solution checks. No runtime or interface changes were required. Wider gameplay/touch/appearance/offline-launch acceptance remains separate. Next is user review of a small reproducible generated sample set; default revision 4 remains unchanged until that approval.
