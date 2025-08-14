# Overview

AI Lab Generator is an intelligent assessment platform designed for educational lab environments, specifically targeting chemistry and other STEM subjects. The application uses AI to generate unique question variants from templates, analyze difficulty levels, and ensure content uniqueness. The platform serves both instructors (who create and manage questions) and students (who complete assignments), providing a comprehensive solution for automated assessment generation and management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React 18 using TypeScript and follows a component-based architecture. Key architectural decisions include:

- **React Router Alternative**: Uses Wouter for client-side routing, providing a lightweight alternative to React Router
- **State Management**: TanStack Query (React Query) for server state management and caching, eliminating the need for Redux or similar global state solutions
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling, ensuring accessibility and consistent design
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
The backend follows a REST API pattern with Express.js and implements a service-oriented architecture:

- **API Layer**: Express.js with typed routes and middleware for request logging and error handling
- **Service Layer**: Modular services for question generation, difficulty analysis, and uniqueness validation
- **Data Access Layer**: Storage abstraction interface allowing for flexible database implementations
- **AI Integration**: OpenAI GPT-4 integration for intelligent question generation and difficulty assessment

## Data Storage Solutions
The application uses PostgreSQL as the primary database with the following design choices:

- **ORM**: Drizzle ORM for type-safe database queries and migrations
- **Connection**: Neon serverless PostgreSQL for scalable cloud database hosting
- **Schema Design**: UUID-based primary keys with relational design supporting users, question templates, generated questions, assignments, and analytics
- **Session Management**: PostgreSQL-backed session storage using connect-pg-simple

## Authentication and Authorization
The system implements role-based access control with three user roles:

- **Students**: Can view and complete assigned questions
- **Instructors**: Can create question templates, generate questions, and manage assignments
- **Administrators**: Full system access for user and content management
- Session-based authentication with secure cookie handling

## AI-Powered Question Generation
The core feature leverages OpenAI's GPT-4 model for intelligent content creation:

- **Template-Based Generation**: Instructors create question templates with variables that AI fills with appropriate values
- **Difficulty Analysis**: Multi-factor difficulty scoring combining AI assessment with rule-based metrics
- **Uniqueness Validation**: Similarity detection using lexical, structural, and semantic analysis to prevent duplicate questions
- **Batch Processing**: Efficient generation of multiple question variants from single templates

# External Dependencies

## AI Services
- **OpenAI GPT-4**: Primary AI service for question generation, difficulty assessment, and content analysis
- **API Integration**: RESTful integration with proper error handling and rate limiting considerations

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations with automatic migration management

## Authentication & Session Management
- **connect-pg-simple**: PostgreSQL-backed session storage for scalable session management
- **Express Session**: Server-side session handling with secure configuration

## Frontend Dependencies
- **Radix UI**: Accessible component primitives for consistent UI behavior
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form handling with validation support

## Development Tools
- **TypeScript**: Full-stack type safety for better developer experience and code reliability
- **Vite**: Modern build tool with hot module replacement for fast development
- **ESBuild**: Fast JavaScript bundler for production builds