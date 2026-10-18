# Fin quote dedup rules (enforced in generate_fin_quote_reel.cjs)

1. Exact quote match blocked for 30 days via fin_quote_history.json
2. Same author blocked for last 8 posts
3. Similarity > 0.35 blocked against last 50 history entries
4. NEVER fall back to full catalog if that would re-post a recent exact quote — use least-recently-used instead
5. History MUST be committed after each successful render (workflow already tries)

If you still see duplicates: history file was empty on runner (not committed). Seed known spam quotes into fin_quote_history.json.
