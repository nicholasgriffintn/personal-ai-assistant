# Personal Assistant

A full-featured AI assistant application available at [polychat.app](https://polychat.app), built with Cloudflare Workers AI, AI Gateway and a bunch of other services. This project includes both a web/mobile application and a robust API backend, allowing me to create and control my own LLM assistant.

Check out my write up on this project [here](https://nicholasgriffin.dev/blog/building-my-own-ai-assistant).

## Features

- Multiple provider and model support
  - Anthropic
  - Bedrock
  - DeepSeek
  - OpenAI
  - Google AI Studio
  - Grok
  - Groq
  - Hugging Face
  - Mistral
  - OpenRouter
  - Perplexity
  - Replicate
  - Cloudflare AI
  - Ollama
  - Github Models
- [An AI assisted podcasting app](https://nicholasgriffin.dev/blog/launching-an-automated-podcasting-app)
- [Drawing to painting and guessing the drawing app](https://nicholasgriffin.dev/blog/anyone-can-draw)
- Llamaguard Guardrails Support
- [Bedrock Guardrails Support](https://nicholasgriffin.dev/blog/protecting-content-with-aws-bedrock-guardrails)
- [Benchmarking](https://nicholasgriffin.dev/blog/building-a-tool-to-benchmark-ai)
- [RAG with Vectorize](https://nicholasgriffin.dev/blog/adding-rag-to-my-ai-assistant)
- [Automated model routing](https://nicholasgriffin.dev/blog/building-a-first-party-prompt-router)
- [Bedrock Knowledge Bases](https://nicholasgriffin.dev/blog/trying-out-bedrock-knowledge-bases)
- Prompt Coaching
- Monitoring with Cloudflare Analytics Engine
- Media uploading to Cloudflare R2

## Notes

### How to delete all keys

```bash
NAMESPACE_ID=<YOUR_NAMESPACE_ID> npx tsx scripts/purge-kv.ts
```
