# Architectural Decisions

## Frontend

- Adopted React Router for clear navigation between Home, Guided Walkthrough, Chat, History, and About. This keeps the experience modular and mobile-friendly without changing the stack.
- Implemented a lightweight UI system with Tailwind + custom CSS variables for typography and brand tones. This preserves performance while giving a professional visual baseline.
- Built a guided walkthrough flow with a stepper and explicit states to avoid hidden transitions and improve reliability for first-time users.
- Stored guides, chats, and preferences in localStorage to provide instant history and personalization without adding backend complexity.

## Backend

- Deferred LLM initialization until first use to improve startup reliability and enable test execution without an OpenAI key.
- Added structured error responses with trace IDs to surface user-friendly messages while keeping detailed errors behind a debug flag.
- Introduced request validation constraints for input hygiene and safer error handling.

## Quality

- Added formatter and lint tools for both Python and JavaScript to standardize code style.
- Added minimal automated tests to validate key API routes and parsing utilities.
- Introduced CI workflow to run build, lint, and tests on every push.
