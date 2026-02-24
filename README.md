# PulseChat

A high-performance, real-time messaging application built for the Tars Full Stack Intern Challenge 2026.

## Features Built
- **Real-time 1-on-1 and Group Messaging**: Powered by Convex subscriptions.
- **Authentication**: Secure user login with Clerk.
- **Online Presence**: Real-time connected/offline status indicators.
- **Typing Indicators**: See when users are typing in real-time.
- **Unread Message Badges**: Keep track of unseen messages.
- **Smart Auto-Scroll**: Instantly jump to new messages.
- **Soft Deletes**: Delete your own messages natively.
- **Emoji Reactions**: React to messages seamlessly.
- **Responsive Architecture**: Fluid UI adapting to desktop and mobile environments.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Backend & Database**: Convex (Real-time DB)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)

## Getting Started Locally

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the Environment Variables by creating a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
   ```
4. Start the Convex development server:
   ```bash
   npx convex dev
   ```
5. In a separate terminal, start the Next.js development server:
   ```bash
   npm run dev
   ```
6. Visit `http://localhost:3000`.

## Deployment to Vercel

1. Push your code to a public GitHub repository.
2. Go to Vercel and import the repository.
3. In the Vercel project settings, set the exact same Environment Variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CONVEX_URL`).
4. In your Convex Dashboard (Settings -> Environment Variables), make sure you configure your production `CLERK_ISSUER_URL` correctly based on your Clerk instance to allow authentication syncing for the production environment.
5. Deploy the application.

*PulseChat - Built with precision.*
