# Task Manager Application

A full-stack task management application built with React, Express, and PostgreSQL.

## Features

- User authentication (register, login, logout)
- Create, read, update, and delete tasks
- Task priority management
- Drag and drop task reordering
- Responsive design with modern UI

## Tech Stack

### Frontend
- React
- TypeScript
- TailwindCSS
- Shadcn UI Components
- Vite

### Backend
- Node.js
- Express
- PostgreSQL
- Drizzle ORM

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-username/task-manager.git
cd task-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database and update the `.env` file:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/your_database
```

4. Push the database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## License

MIT 