# 🤖 AUTONOMY & STABILITY PROTOCOL

> **CRITICAL DIRECTIVE FOR AI AGENT:**
> You are operating in an autonomous, long-term development environment. To ensure stability, prevent regressions, and maintain context over long sessions, you MUST adhere strictly to the following rules.

## 1. Test-Driven Development (The "No Blind Coding" Rule)
You are strictly forbidden from writing or modifying production code (HTML/JS/CSS/Supabase) without FIRST writing or adapting a test that verifies the feature or bug.
- If you claim to fix a "Blank Screen" or "Broken Tab", you MUST write a Playwright script that physically clicks the tab and checks if the content `.isVisible()`.
- If the Playwright test fails, your fix has failed. Do not mark the task as complete until the visual/e2e test passes.

## 2. Memory & Context Management (The "Journaling" Rule)
Because your context window is limited, you must maintain a written log of your decisions.
- Create and maintain a `LESSONS_LEARNED.md` or `ARCHITECTURE.md` file in this workspace.
- Before ending your turn or asking the user for review, append a short summary of:
    1. What problem you solved.
    2. Why you chose the solution (e.g. "Used RPC instead of direct insert because of RLS policies").
    3. What the next AI action should logically be.
- Read this file at the start of every new session.

## 3. SEO & Semantic HTML (The "Foundation" Rule)
You must build with Semantic HTML from Day 1. Do not use generic `<div>` tags when `<nav>`, `<article>`, `<aside>`, or `<section>` are appropriate. Ensure every page layout has a single `<h1>` and proper meta-data structure to save refactoring time later.

## 4. Error Handling & Validation
Do not assume API calls or DOM elements exist. Every selector and Supabase query MUST be wrapped in robust error handling. If a query fails, log it clearly to the console so Playwright or the user can capture the exact reason.

***
**Acknowledge this protocol by stating "Protocol Accepted" and outline your immediate next step based on the provided mission briefing.**
