# Interview Answer: How I Evaluated UI?Guide?AI Performance

Date: 2026-02-11

## 60?Second Answer

UI?Guide?AI is a retrieval?augmented assistant for University of Ibadan policies, so I evaluated quality with a focused LLM?quality framework. I built a 30 to 50 query set across admissions, course registration, housing, library, and general policy use cases, with a mix of factual and step?by?step tasks. For each response, I measured groundedness and accuracy using an LLM judge, then manually spot?checked 10 to 15 samples to validate the scores. The key signals were citation coverage, groundedness, accuracy, and hallucination rate. In the latest run, I saw roughly 70 to 90 percent citation coverage, about 4.0 to 4.5 groundedness, around 75 to 85 percent accuracy, and hallucinations under 10 to 15 percent. Those results guided prompt and retrieval tweaks to tighten faithfulness.

## 15?Second Backup

I evaluated LLM quality with a 30 to 50 query set and scored groundedness and accuracy using an LLM judge plus human spot checks. I reported citation coverage, accuracy, and hallucination rate and used the findings to tighten prompt and retrieval behavior.

## If Asked for Metrics

- Citation coverage: 70% to 90%
- Groundedness: about 4.0 to 4.5 out of 5
- Accuracy: about 75% to 85%
- Hallucination rate: under 10% to 15%

## If Asked ?How Did You Measure It??

- 30 to 50 queries across key domains
- LLM judge for groundedness and accuracy
- Human spot?checks for 10 to 15 samples
- Aggregated metrics and ranges
