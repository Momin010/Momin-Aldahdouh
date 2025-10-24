# MominAI

MominAI is an AI-powered web application that functions as an interactive IDE for building and editing projects. It combines code editing, visual UI design, AI-assisted development, and deployment features into a comprehensive platform.

## Features

- **AI-Powered Development**: Leverage Google Gemini for intelligent code generation, project planning, and assistance.
- **Visual Editor**: WYSIWYG interface for designing UIs with real-time preview.
- **Database Canvas**: Visual schema editor for database design.
- **Project Management**: Version history, multi-project workspaces, and collaborative features.
- **Authentication**: Secure user sign-up, sign-in, and session management.
- **Deployment**: One-click deployment to platforms like Netlify and Vercel.
- **GitHub Integration**: Seamless version control and collaboration.
- **Multi-Agent System**: Specialized AI agents for different tasks (frontend, backend, standalone).

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, ReactFlow
- **Backend**: Node.js API routes, Vercel Postgres, Google Gemini AI
- **Authentication**: JWT, bcryptjs
- **Other Tools**: UUID, JSZip, InteractJS

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Vercel account for deployment (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mominai-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following:
   ```
   GEMINI_API_KEY_1=your_gemini_api_key_here
   DATABASE_URL=your_vercel_postgres_url_here
   JWT_SECRET=your_jwt_secret_here
   ```

4. Set up the database:
   ```bash
   npm run setup-db
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign Up/In**: Create an account or sign in to access your workspace.
2. **Create a Project**: Use the landing page to describe your project idea.
3. **AI Planning**: The AI will generate a detailed project plan (PRD) for approval.
4. **Code Generation**: After approval, the AI generates backend, frontend, and standalone HTML code.
5. **Visual Editing**: Use the visual editor to modify the UI in real-time.
6. **Deploy**: Deploy your project to production with one click.

## Project Structure

```
├── api/                    # API routes
│   ├── auth/              # Authentication endpoints
│   ├── gemini/            # AI chat endpoints
│   ├── images/            # Image search endpoints
│   └── projects/          # Project management endpoints
├── components/            # React components
│   ├── AuthModal.tsx      # Authentication modal
│   ├── ChatPanel.tsx      # AI chat interface
│   ├── CodeEditor.tsx     # Code editing component
│   ├── VisualEditor.tsx   # Visual UI editor
│   └── ...
├── services/              # Business logic services
│   ├── aiAgentService.ts  # AI agent management
│   ├── authService.ts     # Authentication service
│   ├── geminiService.ts   # Gemini AI integration
│   └── ...
├── lib/                   # Utility libraries
├── hooks/                 # Custom React hooks
├── public/                # Static assets
└── scripts/               # Database setup scripts
```

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a pull request.

## License

This project is licensed under the MIT License.

## Support

For support, please contact [support@mominai.com] or open an issue on GitHub.

## Roadmap

- Enhanced mobile experience
- More AI model integrations
- Advanced collaboration features
- Plugin system for extensions