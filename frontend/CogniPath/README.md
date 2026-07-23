# CogniPath - AI-Powered Career Intelligence Platform

CogniPath is a responsive dark SaaS-style web application for the Infosys Springboard Virtual Internship. It helps users analyze resumes, identify skill gaps, discover suitable career paths, find learning resources, estimate salary ranges, improve resume quality, and visualize career insights.

## Problem Statement

Career planning is complex because new skills are constantly emerging and career information is spread across many online sources. Existing job portals mostly provide job listings, but they do not offer personalized career guidance or intelligent recommendations.

CogniPath solves this by using an AI-powered career intelligence workflow that analyzes user resumes, identifies skill gaps, recommends career paths, suggests learning resources, predicts salary ranges, and provides personalized career insights.

## Objectives

- Develop a resume analysis system
- Identify skill gaps
- Recommend suitable career paths
- Provide personalized job recommendations
- Recommend learning resources
- Predict salary ranges
- Improve resume quality
- Build a scalable and user-friendly platform
- Visualize career insights
- Support data-driven career decision making

## Pages

- `index.html` - landing page, problem statement, features, workflow, testimonials, pricing, FAQ, footer
- `login.html`, `register.html`, `forgot-password.html` - authentication, remember me, password validation, security question
- `dashboard.html` - resume input, CSV upload, career readiness analysis, skill gaps, search, filter, sort, pagination, CSV export
- `profile.html` - profile dashboard, edit profile, completion, account status, password change
- `analytics.html` - career readiness charts using vanilla Canvas
- `reports.html` - generate career intelligence report, export CSV, print/save as PDF
- `admin.html` - manage users, delete users, system statistics, reports link
- `settings.html` - theme, language, notifications, security, privacy
- `contact.html` - contact form, about project, help center

## Demo Login Flow

1. Open `register.html`.
2. Create an account with a strong password and security answer.
3. The app saves the session in localStorage and opens `dashboard.html`.
4. Use Logout to clear the active session.

## CSV Format

```csv
candidate,source,readiness,resume text
Priya,Resume,5,Python SQL analytics dashboard project leadership
Aarav,Skill Gap,2,Cloud security missing beginner database training needed
```

## Backend Architecture Prepared

Suggested FastAPI modules:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `GET /users/me`
- `PATCH /users/me`
- `POST /resumes/upload`
- `POST /resumes/analyze`
- `GET /career-inputs`
- `GET /analytics/summary`
- `POST /reports`
- `GET /admin/users`
- `DELETE /admin/users/{id}`
- `PATCH /settings`

Suggested SQLite tables:

- `users`
- `profiles`
- `resumes`
- `skill_gap_results`
- `career_paths`
- `learning_resources`
- `salary_predictions`
- `reports`
- `settings`
- `activity_logs`

The frontend storage helpers are centralized in `js/app.js`, so API calls can replace localStorage without redesigning the pages.

## Deployment

Deploy the `CogniPath` folder directly to GitHub Pages, Netlify, or any static host. No build step is required.
