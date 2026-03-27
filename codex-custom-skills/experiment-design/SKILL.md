---
name: experiment-design
description: Use for designing high-signal product and growth experiments with clear hypotheses, metrics, sample logic, and rollback/guardrail criteria.
---

# Experiment Design

## Use when
- A feature or strategy choice should be validated before full rollout.
- The task needs A/B test or staged rollout design.

## Workflow
1. State hypothesis in one sentence.
2. Define primary KPI + guardrails.
3. Define variant design and population.
4. Set decision rule and stop conditions.
5. Specify instrumentation events required.

## Output format
- `Hypothesis`
- `Test setup`
- `Metrics`
- `Decision rule`
- `Risk + rollback`

## Rules
- Prefer one strong test over many weak tests.
- Include a no-regression check for trust and conversion.
