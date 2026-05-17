# Development Guide

## 🛠️ Setup & Installation

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd guitar-crm
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Variables**

   Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

   ```bash
   cp .env.example .env.local
   ```

4. **Run Development Server**

   ```bash
   npm run dev
   ```

---

## 🌿 Branching Strategy

We follow a simplified Git flow:

- **`main`**: Production-ready code. Deploys to Production.
- **`develop`**: Integration branch. Deploys to Preview/Staging.
- **Feature Branches**: `feature/feature-name` (branched from `develop`).
- **Bugfix Branches**: `fix/bug-name` (branched from `develop`).

### Workflow

1. Create a feature branch: `git checkout -b feature/my-feature develop`
2. Commit changes.
3. Push and open a Pull Request (PR) to `develop`.
4. CI checks run.
5. Merge to `develop` after approval.

---

## 🧪 Testing

We use a combination of Jest and Cypress.

### Unit & Integration Tests (Jest)

- Run all tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`

### E2E Tests (Cypress)

- Open Cypress: `npm run cypress:open`
- Run headless: `npm run cypress:run`

### TDD Workflow

1. Write a failing test in `__tests__/`.
2. Implement the feature.
3. Verify the test passes.
4. Refactor.

---

## 🚀 CI/CD Pipeline

We use **GitHub Actions** for Continuous Integration and **Vercel** for Continuous Deployment.

### GitHub Actions Workflows

- **`ci.yml`**: Runs on every push to `main` and `develop`, and on PRs.
  - Linting (`npm run lint`)
  - Type Checking (`npm run type-check`)
  - Unit Tests (`npm test`)
  - E2E Tests (`npm run cypress:run`)

### Deployment (Vercel)

- **Preview**: Automatic deployment for every PR.
- **Staging**: Automatic deployment when merging to `develop`.
- **Production**: Automatic deployment when merging to `main`.

### Database Migrations

Database changes are managed via Supabase migrations.

- **Local**: `supabase migration new <name>`
- **CI/CD**: Migrations are applied automatically via GitHub Actions (if configured) or manually via Supabase CLI/Dashboard before deployment.

---

## 📦 Deployment Checklist

Before merging to `main`:

1. Ensure all tests pass.
2. Verify no linting errors.
3. Check that environment variables are set in Vercel Production.
4. Verify database migrations are applied to the production database.
5. Perform a smoke test on the Preview deployment.

---

## 🤖 AI Agents Workflow

We utilize specialized AI agents to assist in development. These are integrated into our Copilot instructions.

### Available Agents

- **@backend-architect**: Design APIs, DB schemas, and backend logic.
- **@frontend-architect**: UI/UX design, accessibility, and responsiveness.
- **@system-architect**: High-level architecture and scalability.
- **@tech-stack-researcher**: Technology choices and trade-offs.
- **@requirements-analyst**: PRDs and user stories.
- **@refactoring-expert**: Code cleanup and optimization.
- **@performance-engineer**: Performance analysis and tuning.
- **@security-engineer**: Security audits and best practices.
- **@technical-writer**: Documentation and guides.
- **@learning-guide**: Explaining concepts.
- **@deep-research-agent**: Complex research tasks.

### Usage

Invoke them in your Copilot chat:
> "@backend-architect Design the schema for the new 'Songs' table."

## Development Credentials

These users are seeded automatically via script: `bash scripts/database/seeding/local/seed-all.sh`.
All passwords are intended for local development only.

```
Admin (role: admin + teacher):
- Email: `p.romanczuk@gmail.com`
- Password: `test123_admin`

Teacher (role: teacher):
- Email: `teacher@example.com`
- Password: `test123_teacher`

Student (role: student):
- Email: `student@example.com`
- Password: `test123_student`

Additional Students:
  teststudent1@example.com / test123_student
  teststudent2@example.com / test123_student
  teststudent3@example.com / test123_student
```

### Usage Notes

- Run the full seed: `bash scripts/database/seeding/local/seed-all.sh` before testing login flows.
- Profiles align with `auth.users` ids; roles are stored on `profiles` table (snake_case columns).
- After seeding you can verify roles:
  ```sql
  SELECT p.email, ur.role 
  FROM profiles p 
  JOIN user_roles ur ON p.id = ur.user_id 
  ORDER BY p.email;
  ```

- Do NOT use these credentials in production.
