# Workspace Guidelines & Agent Instructions

This project follows the developer and AI agent specifications defined in [agent.md](file:///d:/projects-git/nurture-care/agent.md).

## Quick Reference
- **Agent Rule (Strict)**: **DO NOT** launch automated browser subagents or DOM inspection tools. Always ask the user before any browser interaction.
- **Tech Stack**: Go (Gin, embedded SQLite, JWT) + React 19 (TypeScript, Vite, Tailwind CSS v4, Lucide React).
- **Backend Entry Point**: `backend/main.go` on port `8080`.
- **Frontend Entry Point**: `web/` with Vite dev server on port `5173` (proxies `/api` to port `8080`).
- **Default Database**: Zero-install embedded SQLite (`backend/nurture_care.db`) auto-seeded on launch.
- **Seeded Users (Password: 12345)**:
  - `admin`: Super Administrator
  - `agency`: LifeCare Agency Director
  - `care`: LifeCare Care Coordinator
  - `paramedical`: Nurse Pooja Sharma
  - `customer`: Patient Priya Sharma

For full architecture details, dispatch state machines, API routes, and developer runbooks, refer to [agent.md](file:///d:/projects-git/nurture-care/agent.md), [requirement.md](file:///d:/projects-git/nurture-care/requirement.md), and [implementation.md](file:///d:/projects-git/nurture-care/implementation.md).
