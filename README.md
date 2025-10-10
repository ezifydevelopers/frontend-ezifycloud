# Ezify Cloud - Frontend

A modern, responsive web application built with React, TypeScript, and Tailwind CSS for comprehensive leave management and HR operations.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **bun**
- **Git**

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Ezify-Cloud/frontend-ezifycloud

# Install dependencies
npm install
# or
yarn install
# or
bun install

# Start development server
npm run dev
# or
yarn dev
# or
bun dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
frontend-ezifycloud/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── admin/         # Admin-specific components
│   │   ├── auth/          # Authentication components
│   │   ├── employee/     # Employee-specific components
│   │   ├── forms/         # Form components
│   │   ├── layout/        # Layout components (Sidebar, Header)
│   │   ├── manager/       # Manager-specific components
│   │   └── ui/            # Base UI components (shadcn/ui)
│   ├── contexts/          # React contexts (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries and API client
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin pages
│   │   ├── employee/     # Employee pages
│   │   ├── manager/      # Manager pages
│   │   └── shared/       # Shared pages
│   ├── services/         # API service functions
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Application entry point
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## 🎨 Tech Stack

### Core Technologies
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **Lucide React** - Icon library
- **Radix UI** - Headless UI primitives

### State Management
- **React Context** - Global state (Authentication)
- **React Query** - Server state management
- **React Hooks** - Local state management

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Vite** - Fast development server

## 🔐 Authentication & Authorization

### User Roles
- **Admin** - Full system access, user management, reports
- **Manager** - Team management, leave approvals, team reports
- **Employee** - Personal leave requests, profile management

### Authentication Flow
1. User logs in with email/password
2. JWT token stored in localStorage
3. Role-based routing to appropriate dashboard
4. Protected routes require authentication

### Key Files
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/types/auth.ts` - Authentication type definitions
- `src/App.tsx` - Role-based routing logic

## 📱 Pages & Features

### Admin Dashboard
- **User Management** - Create, update, delete users
- **System Settings** - Configure leave policies, departments
- **Reports & Analytics** - Comprehensive reporting
- **Audit Logs** - System activity tracking
- **Department Management** - Organize teams

### Manager Dashboard
- **Team Overview** - Team member statistics
- **Leave Approvals** - Review and approve leave requests
- **Team Calendar** - Team leave calendar view
- **Team Reports** - Team performance metrics

### Employee Dashboard
- **Leave Balance** - Available leave days
- **Request Leave** - Submit new leave requests
- **Leave History** - Past leave requests
- **Profile Management** - Update personal information

## 🎯 Key Components

### Layout Components
- **Sidebar** (`src/components/layout/Sidebar.tsx`) - Navigation sidebar
- **Header** (`src/components/layout/Header.tsx`) - Top navigation
- **Layout** (`src/components/layout/Layout.tsx`) - Main layout wrapper

### Form Components
- **LeaveRequestForm** (`src/components/forms/LeaveRequestForm.tsx`) - Leave request form
- **UserForm** (`src/components/forms/UserForm.tsx`) - User creation/editing form

### UI Components
- All components in `src/components/ui/` are built with shadcn/ui
- Fully customizable and accessible
- Consistent design system

## 🔧 API Integration

### API Client
- **Base URL**: Configurable via environment variables
- **Authentication**: JWT token in Authorization header
- **Error Handling**: Centralized error handling
- **Type Safety**: Full TypeScript support

### Key API Files
- `src/lib/api.ts` - Main API client
- `src/services/userService.ts` - User-specific API calls
- `src/types/api.ts` - API type definitions

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Ezify Cloud
```

## 🎨 Styling & Design

### Design System
- **Colors**: Consistent color palette with semantic naming
- **Typography**: Inter font family with proper hierarchy
- **Spacing**: Tailwind's spacing scale
- **Components**: shadcn/ui component library

### Responsive Design
- **Mobile-first** approach
- **Breakpoints**: sm, md, lg, xl, 2xl
- **Grid System**: CSS Grid and Flexbox
- **Dark Mode**: Ready for future implementation

### Custom Styling
```css
/* Custom CSS in src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component styles */
@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white;
  }
}
```

## 🚀 Development

### Available Scripts
```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview        # Preview production build

# Code Quality
npm run lint          # Run ESLint
npm run type-check    # Run TypeScript checks

# Testing
npm run test          # Run tests (if configured)
```

### Development Guidelines

#### Code Style
- Use **TypeScript** for all new code
- Follow **React best practices**
- Use **functional components** with hooks
- Implement **proper error handling**

#### Component Structure
```tsx
// Component template
import React from 'react';
import { ComponentProps } from './types';

interface Props {
  // Define props
}

const Component: React.FC<Props> = ({ ...props }) => {
  // Component logic
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default Component;
```

#### State Management
- **Local State**: Use `useState` for component state
- **Global State**: Use Context for authentication
- **Server State**: Use React Query for API data

## 🔧 Configuration

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Tailwind Configuration
```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        // Custom colors
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Authentication Issues
- Check if backend is running
- Verify API base URL in environment variables
- Clear localStorage if experiencing login issues

#### 2. Build Issues
- Ensure all dependencies are installed
- Check TypeScript errors
- Verify environment variables

#### 3. Styling Issues
- Check Tailwind CSS configuration
- Verify component imports
- Check for CSS conflicts

### Debug Mode
```bash
# Enable debug logging
VITE_DEBUG=true npm run dev
```

## 📦 Dependencies

### Core Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "typescript": "^5.0.0"
}
```

### UI Dependencies
```json
{
  "@radix-ui/react-*": "^1.0.0",
  "lucide-react": "^0.263.0",
  "tailwindcss": "^3.3.0"
}
```

### Development Dependencies
```json
{
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "@vitejs/plugin-react": "^4.0.0",
  "vite": "^4.4.0"
}
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
```env
VITE_API_BASE_URL=https://api.ezifycloud.com/api
VITE_APP_NAME=Ezify Cloud
```

### Deployment Options
- **Vercel** - Recommended for React apps
- **Netlify** - Static site hosting
- **AWS S3 + CloudFront** - Scalable hosting
- **Docker** - Containerized deployment

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Make changes following code style
3. Test thoroughly
4. Submit pull request

### Code Review Checklist
- [ ] TypeScript types are correct
- [ ] Components are properly structured
- [ ] Error handling is implemented
- [ ] Responsive design is maintained
- [ ] Accessibility standards are met

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

### Useful Tools
- **React Developer Tools** - Browser extension
- **TypeScript Playground** - Online TypeScript editor
- **Tailwind CSS IntelliSense** - VS Code extension

## 📞 Support

For questions or issues:
1. Check this README first
2. Search existing issues
3. Create new issue with detailed description
4. Contact development team

---

**Happy Coding! 🚀**