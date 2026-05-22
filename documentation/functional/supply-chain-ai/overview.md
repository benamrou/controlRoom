# Supply Chain AI — overview

## Purpose

Supply Chain AI adds **retailer-specific operational intelligence** on GOLD:

- Learns business rules through structured Q&A (context learning).
- Routes analyst questions to **skills** with scored vocabulary (no external LLM).
- Executes designer-authored SQL templates and returns **grounded** summaries.
- Monitors **data pipeline health** before trusting analytics.

## Who uses what

| Role | Screens |
|------|---------|
| **AI admin** | Full platform, data health config, diagnostics |
| **AI designer** | Skill studio, phrasing playground, pending phrasings |
| **Supply chain analyst** | AI Assistant, data health dashboard (read/run) |
| **Supply chain operation** | Data health summary, AI Assistant for exception drill-down |

## Module map

| Phase | Screens |
|-------|---------|
| Platform setup | Retailer & GOLD, Schema discovery, Context learning |
| Design | Skill library, Skill builder, Pending phrasings, Playground |
| Operations | Data health, Health config, AI Assistant |

## Rule-based, not generative AI

Answers come from **SQL results + composer rules**. The engine does not call OpenAI/Anthropic or run a local LLM. Conclusions must match query evidence — important for audit and data policy.

## Getting started

1. IT deploys DB scripts and CORPENV / retailer rows.  
2. Designer completes context learning (15 items) and skill packs.  
3. Analysts use **AI Assistant** with retailer selected.  

See [AI Assistant](functional/supply-chain-ai/ai-assistant.md) and [Technical AI engine](technical/supply-chain-ai/ai-engine.md).
