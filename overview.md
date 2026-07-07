# ssposter Overview

## Product Summary

ssposter is a social media post scheduler. It helps users create, schedule, queue, and publish posts to connected social media accounts.

The application is designed to run in a serverless environment on Vercel. Scheduled publishing work is coordinated through an Upstash queue system, with persistent application data stored in a Postgres database.

The first version will support X and LinkedIn. It will be free to use and focused on single-user connected accounts rather than teams or multi-tenant workspaces.

## Current Project State

The repository currently contains a Next.js application scaffolded with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- shadcn/ui configuration
- A starter shadcn/ui Button component

Planned additions include Better Auth, Drizzle, Docker-based Postgres for local development, and Upstash QStash for scheduled publishing jobs.

## Intended Architecture

### Web Application

The main product UI is a Next.js application deployed to Vercel. Users will use this interface to manage social accounts, compose posts, schedule publishing times, and review scheduled or completed posts.

### Serverless Runtime

The backend should be built around Vercel serverless functions and route handlers. Serverless execution should handle user actions, scheduling requests, queue dispatch, webhook handling, and publishing callbacks.

### Queue System

Upstash QStash will be used as the queue layer for scheduled publishing jobs. QStash should decouple user-facing scheduling actions from background publishing work so the UI remains responsive and publishing can be retried safely.

Expected queue responsibilities:

- Enqueue scheduled post publishing jobs
- Trigger publishing workflows at the scheduled time
- Retry failed publishing attempts automatically
- Preserve enough metadata to diagnose failed or delayed jobs

### Database

Postgres will store durable application state. Local development will use Postgres through Docker, and Drizzle will be used as the database access and schema layer.

Expected data areas:

- Users and Better Auth metadata
- Connected social accounts
- Draft posts
- Scheduled posts
- Publishing jobs and status history
- Platform-specific post metadata
- Uploaded media metadata
- Audit or activity history

### Authentication

Better Auth will be used for application authentication. The initial product scope is single-user accounts only, meaning the app should support individual users connecting and scheduling posts for their own social accounts.

### Social Platforms

The first supported publishing platforms are:

- X
- LinkedIn

Platform integrations should account for text posts and image posts in the first version.

## Likely Core Workflows

### Schedule a Post

1. User creates a post in the application.
2. User adds text and, optionally, an image.
3. User selects one or more connected X or LinkedIn accounts.
4. User chooses a scheduled publish time.
5. The app stores the scheduled post in Postgres.
6. The app enqueues a publishing job through QStash.
7. The UI shows the post as scheduled.

### Publish a Scheduled Post

1. QStash triggers the scheduled publishing job.
2. A Vercel serverless handler loads the post and account credentials from Postgres.
3. The handler publishes the text and image content to the selected social platform.
4. The handler records success or failure in Postgres.
5. Failed jobs are retried automatically before being marked for user attention.

## Initial Technical Assumptions

- The app will be deployed on Vercel.
- Next.js will be the primary full-stack framework.
- Upstash QStash will provide scheduled/background publishing dispatch.
- Postgres will be the primary database, with Docker used for local development.
- Drizzle will be the database access and schema layer.
- Better Auth will be used for authentication.
- shadcn/ui will be used for application UI components.
- The product will need secure storage and refresh handling for social platform credentials.
- The first version will support text and image posts.
- The first version will be free only, with no billing or plan limits.

## V1 Scope

The first version should include:

- Single-user account sign-in with Better Auth
- Connect X and LinkedIn accounts
- Compose text posts
- Attach images to posts
- Schedule posts for future publishing
- Dispatch scheduled publishing through QStash
- Store posts, jobs, social accounts, and media metadata in Postgres
- Track scheduled, published, failed, and retrying statuses
- Automatically retry failed publishing jobs

## Still Needs Decisions

The following details still need to be finalized:

- Where uploaded images should be stored
- The exact retry policy for failed publishes
- Whether recurring posts are in scope
- Whether posts can target multiple platforms at once
- Whether platform-specific post customization is needed before scheduling
- Whether OAuth credentials should be encrypted with a dedicated key management strategy
