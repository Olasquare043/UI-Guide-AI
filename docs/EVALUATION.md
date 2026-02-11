# UI Guide LLM Quality Evaluation Framework

Date: 2026-02-11

## Purpose

Define a repeatable, interview-ready method to evaluate UI Guide LLM quality with emphasis on groundedness and accuracy.

## Scope

This framework evaluates only LLM quality for the retrieval-augmented assistant. It does not cover UX, latency, or infrastructure.

## Evaluation Dataset

Target size: 30 to 50 queries.

Domain distribution:

| Domain | Target count |
| --- | --- |
| Admissions | 6 to 10 |
| Course registration | 6 to 10 |
| Housing | 4 to 6 |
| Library | 4 to 6 |
| General policies | 6 to 10 |
| Edge cases | 3 to 5 |

Query type distribution:

| Type | Target share |
| --- | --- |
| Factual or policy | 60% |
| Process or step-by-step | 30% |
| General or edge-case | 10% |

Query record schema:

| Field | Description |
| --- | --- |
| id | Unique ID, for example Q-001 |
| domain | Admissions, Course registration, Housing, Library, General policy, Edge |
| type | Factual, Process, Edge |
| query | User question |
| expected_docs | Document names expected or None if not applicable |
| key_facts | Specific facts to verify, optional |
| expected_behavior | Cite sources or say no doc, ask clarify, or refuse |
| notes | Optional evaluator notes |

### Sample query set (30 items)

Use these as starters and replace placeholders with actual document references once your docs are available.

| id | domain | type | query | expected_docs | expected_behavior |
| --- | --- | --- | --- | --- | --- |
| Q-001 | Admissions | Factual | What are the admission requirements for undergraduate applicants? | Admissions policy | Cite sources |
| Q-002 | Admissions | Process | Walk me through the steps to submit an undergraduate application. | Admissions policy | Step-by-step with citations |
| Q-003 | Admissions | Factual | Are there admission requirements for transfer students? | Admissions policy | Cite sources or state not in docs |
| Q-004 | Admissions | Factual | What documents are required for postgraduate admission? | Admissions policy | Cite sources |
| Q-005 | Admissions | Process | How do I check my admission status on the portal? | Admissions portal guide | Step-by-step with citations |
| Q-006 | Admissions | Factual | What is the deadline for admission applications? | Admissions policy | Cite sources or say not found |
| Q-007 | Course registration | Process | How do I register for my courses each semester? | Registration guide | Step-by-step with citations |
| Q-008 | Course registration | Factual | What is the maximum credit load for a semester? | Academic policy | Cite sources |
| Q-009 | Course registration | Process | How do I add or drop a course? | Registration guide | Step-by-step with citations |
| Q-010 | Course registration | Factual | Are there late registration penalties? | Academic policy | Cite sources |
| Q-011 | Course registration | Process | How do I resolve a registration hold? | Student services policy | Step-by-step with citations or ask for context |
| Q-012 | Course registration | Factual | What are the rules for course withdrawal? | Academic policy | Cite sources |
| Q-013 | Housing | Factual | What is the eligibility for on-campus housing? | Housing policy | Cite sources |
| Q-014 | Housing | Process | How do I apply for a hostel or dorm room? | Housing policy | Step-by-step with citations |
| Q-015 | Housing | Factual | Are there housing fees and when are they due? | Housing policy | Cite sources or state not found |
| Q-016 | Housing | Process | What should I do if I need to change my housing assignment? | Housing policy | Step-by-step with citations or ask for context |
| Q-017 | Library | Factual | What are the library opening hours? | Library policy | Cite sources or say not found |
| Q-018 | Library | Process | How do I borrow books from the library? | Library policy | Step-by-step with citations |
| Q-019 | Library | Factual | What is the fine for late returns? | Library policy | Cite sources |
| Q-020 | Library | Process | How do I access electronic resources off campus? | Library policy | Step-by-step with citations |
| Q-021 | General policy | Factual | What are the student conduct rules? | Student handbook | Cite sources |
| Q-022 | General policy | Factual | What is the grading scale? | Academic policy | Cite sources |
| Q-023 | General policy | Process | How do I request a transcript? | Registrar policy | Step-by-step with citations |
| Q-024 | General policy | Factual | What are the rules for deferment? | Academic policy | Cite sources or say not found |
| Q-025 | General policy | Process | How do I update my student profile details? | Portal guide | Step-by-step with citations |
| Q-026 | General policy | Factual | What is the policy for exam misconduct? | Student handbook | Cite sources |
| Q-027 | Edge | Edge | What can you help me with? | None | Answer without retrieval |
| Q-028 | Edge | Edge | Hello, how are you? | None | Friendly response without citations |
| Q-029 | Edge | Edge | What is the capital of France? | None | Answer directly, no citations |
| Q-030 | Edge | Edge | I need advice on a non?UI policy issue. | None | Explain scope and redirect |

## Rubric

Score each response on 1 to 5 for groundedness and accuracy.

Groundedness scale:

| Score | Definition |
| --- | --- |
| 5 | Every material claim is supported by cited documents. |
| 4 | Minor gaps, but core claims are grounded. |
| 3 | Mixed; some claims unsupported or weakly supported. |
| 2 | Mostly unsupported; citations do not match claims. |
| 1 | Fully ungrounded or hallucinated. |

Accuracy scale:

| Score | Definition |
| --- | --- |
| 5 | Fully correct relative to the documents. |
| 4 | Mostly correct with minor errors. |
| 3 | Partial correctness or missing key facts. |
| 2 | Mostly incorrect or misleading. |
| 1 | Incorrect and unsafe. |

Hallucination rate:

- Binary per response: any unsupported claim present.
- Aggregate: percent of responses with hallucinations.

Optional secondary criterion:

- Helpfulness and clarity (1 to 5) for step-by-step usefulness.

## Scoring Method

1. Run each query through the system with retrieval enabled.
2. Capture the answer and cited sources.
3. Use an LLM judge prompt to score groundedness and accuracy.
4. Manually spot?check 10 to 15 samples for judge reliability.
5. Record citation coverage, groundedness average, accuracy average, hallucination rate.
6. Summarize results with approximate ranges for interview use.

## LLM Judge Prompt Template

Use the following template for automated scoring:

```
You are an evaluator for a retrieval-augmented assistant.
Given a question, answer, and cited sources, score groundedness and accuracy.
Return JSON only.

Question: {question}
Answer: {answer}
Sources: {sources}

Score:
- groundedness: 1-5
- accuracy: 1-5
- hallucination: true or false
- notes: short justification
```

## Reporting

Metrics to report:

- Citation coverage: percent of responses that cite valid sources.
- Groundedness: average score or percent >= 4.
- Accuracy: average score or percent >= 4.
- Hallucination rate: percent of responses with unsupported claims.

Approximate ranges for interview use:

- Citation coverage: 70% to 90%
- Groundedness: about 4.0 to 4.5 out of 5
- Accuracy: about 75% to 85%
- Hallucination rate: under 10% to 15%

## Test Scenarios

- Docs-backed questions must cite and align with the documents.
- Non-doc questions should not force retrieval or citations.
- Ambiguous requests should ask for clarification or describe missing info.
- Out-of-scope requests should decline politely and redirect.
