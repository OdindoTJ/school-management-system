# School Management System

A secure, production-ready school management system with:
- Public website with parent/student portal
- Staff/Admin dashboard on a separate subdomain
- Supabase authentication and database

## Architecture

- **Backend**: Django 5.1 + DRF + Supabase
- **Public Frontend**: React + TailwindCSS
- **Staff Dashboard**: React + TailwindCSS (separate domain)

## Security Approach

- Staff dashboard on separate subdomain (`staff.school.com`)
- No public links to staff login
- CORS restricted to approved domains
- Supabase JWT authentication
- Environment-based configuration

## Project Structure
