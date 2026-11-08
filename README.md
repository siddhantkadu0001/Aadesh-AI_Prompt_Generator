# AI Prompt Generator

A free tool that turns your input into a ready-to-use AI prompt using proven prompt patterns. It runs entirely in your browser: no backend, no login, no paid API.

## How it works
1. Pick a prompt pattern (Persona, Few-Shot, Chain-of-Thought, Template Fill, Critique, Guardrail, Meta-Prompt, Decomposition, Audience Adaptation or Boundary).
2. Fill in the fields for that pattern.
3. Click **Generate** to get the finished prompt, a system prompt and a recommended temperature.
4. Copy it, save it to history, or export it as .txt or .md.

## Features
- 10 prompt patterns loaded from `data/templates.json`
- Input checks for empty fields, length and blocked phrases
- Copy, Save, Export (.txt and .md) and History
- Dark mode
- Works offline after the first load; nothing you type is sent to a server

## Run it locally
The page loads `data/templates.json` with `fetch`, so open it through a local server:
1. Install the free **Live Server** extension in VS Code.
2. Right-click `index.html` and choose **Open with Live Server**.

## Project structure