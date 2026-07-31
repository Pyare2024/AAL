# Product Requirements Document (PRD)

## Project Name

**AI Apex Launchpad -- Internship Provider & Management System**

## 1. Product Overview

AI Apex Launchpad is a web-based Internship Provider and Management
System that streamlines the complete internship lifecycle, from intern
onboarding to learning, productivity tracking, and performance
management. The platform provides secure role-based access for
**Interns**, **Admins**, and **Super Admins** while ensuring each user
can access only the information relevant to their responsibilities.

------------------------------------------------------------------------

## 2. Target Users

### Intern

-   Register and complete onboarding
-   Participate in internship activities
-   Learn through LMS
-   Track daily internship progress

### Admin

-   Manage interns assigned to specific problem statements
-   Monitor onboarding progress
-   Review intern performance and submissions

### Super Admin

-   Manage the complete internship ecosystem
-   Create and manage admins
-   Allocate problem statements
-   Monitor platform operations and analytics

------------------------------------------------------------------------

## 3. Core Features (Version 1)

### Authentication & Authorization

-   Secure Login
-   Forgot Password
-   Role-Based Authentication
-   Secure Session Management
-   Dashboard redirection based on role

### Intern Onboarding

1.  Register
2.  Basic Profile Completion
3.  Questionnaire
4.  LMS Introduction
5.  Seven Activities
6.  Interview
7.  Problem Statement Allocation
8.  Internship Activation

### Existing Intern

-   Direct Login
-   Continue Internship

### Intern Dashboard

#### Productivity

-   Attendance Marking
-   Daily Diary
-   To-Do Management
-   Pending Work Submission

#### Learning

-   Learning Activities
-   Advanced LMS Integration (API)
-   Tenon Integration (API)

#### Engagement

-   Community Discussion
-   AI Post Generation
-   Leaderboard
-   Announcements
-   Feedback & Suggestions

#### Account

-   Profile Management
-   Settings

### Admin Dashboard

#### Dashboard

-   Assigned Intern Summary

#### Intern Management

**New Intern Onboarding** - View all newly registered interns - Track
onboarding progress - Review questionnaires - Review interview status

**Active Interns** - View only interns assigned to the Admin's allocated
Problem Statement(s) - Search and filter interns - View intern profile -
Monitor internship progress

#### Operations

-   Attendance Review
-   Daily Diary Review
-   Pending Work Review

#### Learning

-   Questionnaires
-   Learning Activities
-   LMS
-   Advanced LMS
-   Tenon Integration

#### Engagement

-   Community Discussion
-   AI Post Generation
-   Leaderboard
-   Announcements
-   Feedback & Suggestions

#### Account

-   Profile
-   Settings

### Super Admin Dashboard

#### Dashboard

-   Platform Overview
-   Reports

#### Admin Management

-   Create/Edit/Delete Admin
-   Activate/Deactivate Admin
-   Allocate Problem Statements

#### Problem Statement Management

-   Create/Edit/Delete Problem Statements

#### Intern Management

-   View all onboarding interns
-   View all active interns
-   Allocate interns to Problem Statements
-   Transfer interns between Problem Statements

#### Operations

-   Attendance
-   Daily Diary
-   Pending Work

#### Learning

-   Questionnaires
-   LMS
-   Advanced LMS
-   Tenon

#### Engagement

-   AI Post Generation
-   Leaderboard
-   Announcements
-   Community
-   Feedback

#### Reports & Analytics

-   Attendance Reports
-   Learning Reports
-   Internship Reports
-   Admin Performance Reports

#### Platform Settings

-   System Configuration
-   Profile
-   Settings

------------------------------------------------------------------------

## 4. Out of Scope (Version 1)

-   Mobile Application
-   AI Internship Recommendation
-   Live Video Interviews
-   Real-time Chat
-   Certificate Generation
-   Payment Gateway
-   Email/SMS Automation
-   Third-party HR Integrations
-   Predictive Analytics
-   Multi-language Support

------------------------------------------------------------------------

## 5. User Roles & Permissions

### Intern

**Can** - Complete onboarding - Access own dashboard - Mark attendance -
Submit daily diary - Manage to-do - Submit pending work - Access
learning - Community participation - Generate AI posts - View
announcements - Submit feedback - Manage profile/settings

**Cannot** - View other interns - Manage admins - Allocate problem
statements - Access admin modules

### Admin

**During Onboarding** - View all newly registered interns - Monitor
onboarding progress

**After Allocation** - View only interns belonging to allocated Problem
Statement(s) - Review attendance, diary, pending work, learning,
feedback

**Cannot** - View interns from other problem statements - Create
admins - Access Super Admin modules

### Super Admin

-   Full platform access
-   Create/manage admins
-   Allocate problem statements
-   View all interns
-   Configure platform

------------------------------------------------------------------------

## 6. Key Business Rules

-   Every user has one role.
-   Every user must authenticate.
-   New interns complete onboarding before becoming active.
-   Existing interns log in directly.
-   **All Admins can view every intern during onboarding.**
-   **Once a Super Admin allocates a Problem Statement, only the
    Admin(s) assigned to that Problem Statement can manage that
    intern.**
-   Super Admin can always view every intern.
-   Each active intern must belong to exactly one Problem Statement.
-   Role-based access must be enforced using Supabase Row Level Security
    (RLS).

------------------------------------------------------------------------

## 7. Success Criteria

-   New interns complete onboarding successfully.
-   Existing interns can log in directly.
-   Super Admin creates and manages admins.
-   Super Admin allocates Problem Statements successfully.
-   All Admins can monitor onboarding interns.
-   After allocation, each Admin sees only their allocated interns.
-   Interns can use attendance, diary, to-do, pending work, LMS,
    community, AI posts, announcements, leaderboard, and feedback.
-   Role-based security prevents unauthorized access.
-   Reports accurately reflect internship progress and engagement.

------------------------------------------------------------------------

## MVP Goal

Build a secure, scalable internship management platform where every new
intern follows a common onboarding process visible to all Admins, and
once assigned to a Problem Statement, becomes visible only to the
responsible Admin(s), while the Super Admin maintains complete control
over the platform.
