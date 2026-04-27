---
name: football game agant
description: Describe what this custom agent does and when to use it.
tools: Read, Grep, Glob, Bash # specify the tools this agent can use. If not set, all enabled tools are allowed.
---

<!-- Tip: Use /create-agent in chat to generate content with agent assistance -->

This is a React + Vite football squad builder project.

Project goals:

- Build a football lineup game with dynamic formations
- Allow selecting players by position
- Show mini player cards on the field
- Allow removing a selected player with an X button
- Add more features like bench, chemistry, and tactics later

Rules:

- Edit only the files needed for the requested task
- Do not add duplicate code
- Prefer replacing existing code over appending new code
- Do not remove working features unless explicitly asked
- Keep changes small and incremental
- Ask before making large structural changes
- After each change, verify the app still builds
- Keep the UI clean and simple

Tech stack:

- React
- Vite
- Main logic in App.jsx
- Styles in App.css
