# MyFinance

Personal finance management application built by **Marcello Orru**.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js 18+ & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd myfinance

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Development

```sh
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

This project can be deployed to any platform that supports Node.js:
- Netlify
- Cloudflare Pages
- Railway

## Project Structure

```
src/
├── components/     # UI components (shadcn/ui based)
├── pages/          # Route pages
├── hooks/          # Custom React hooks
├── lib/            # Utilities and helpers
├── integrations/   # Supabase client and types
└── App.tsx         # Main app with routing
```

## Database

This project uses Supabase as the backend. Database migrations are located in `supabase/migrations/`.

To apply migrations to a new Supabase project:

```sh
supabase link --project-ref <your-project-ref>
supabase db push
```

## Author

**Marcello Orru**

## License

MIT
