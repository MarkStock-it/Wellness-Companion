# AI API efficiency rule

- Treat provider tokens, multimodal inputs, grounded searches, and repeat requests as user costs.
- Prefer deterministic local code and existing API data before calling an AI model.
- Send only fields needed by the selected mode; remove identity data and unrelated wellness history.
- Bound input history, text, image resolution/detail, reasoning effort, and output tokens per task.
- Cache identical safe, non-chat requests and reuse existing results.
- Never add automatic/background AI calls when an explicit user action can trigger them.
- Verify any new AI mode has a task-specific token budget and compact payload before merging.
