# Personal Assistant

A personal assistant built with Cloudflare AI, the reason for this project is to reduce my reliance on other AI services while also being able to expand the models that I can use, without needing a massive server somewhere.

Check out my write up on this project [here](https://nicholasgriffin.dev/blog/building-my-own-ai-assistant).

## Deleting all keys

```bash
NAMESPACE_ID=<YOUR_NAMESPACE_ID> npx tsx scripts/purge-kv.ts
```
