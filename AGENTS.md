# Agent instructions

The instructions for coding agents in this repository are in [CLAUDE.md](CLAUDE.md). They apply to every agent, not only Claude.

The most important rule: **after every change in the repo, update or create the related knowledge files under [`context/`](context/index.md)** (Open Knowledge Format v0.2), run `npm run context`, and add an entry to `context/log.md`. See CLAUDE.md for the steps.
