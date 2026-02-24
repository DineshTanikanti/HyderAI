# 💧 HydrAI - Smart Hydration Tracker

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://hyder-ai25.vercel.app)
[![Supabase Backend](https://img.shields.io/badge/Backend-Supabase-green?style=for-the-badge&logo=supabase)](https://supabase.com)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

HydrAI is a high-performance Progressive Web App (PWA) designed to manage daily hydration goals with precision. Built with a serverless "Hard-Sync" architecture, it ensures absolute data parity across mobile and desktop devices, eliminating local cache ghosting.

## 🚀 Key Features

* ☁️ **Real-time Cloud Sync:** Powered by Supabase, leveraging direct database fetching to ensure logging or deleting water instantly updates across all active sessions.
* 🌡️ **AI Weather Integration:** Automatically fetches live temperature data (specifically calibrated for high-temperature regions like Tadipatri) via the Open-Meteo API to dynamically increase daily hydration targets when temperatures exceed 35°C.
* 👨‍👩‍👧‍👦 **Social Hydration Groups:** WhatsApp-style group management. Users can create "Hydration Families" and join via secure, auto-generated 6-digit alphanumeric codes.
* 📱 **PWA Ready:** Fully installable on iOS and Android devices, featuring a custom standalone UI, maskable icons, and a tailored dark-mode theme.
* 🛡️ **Data Integrity & Safety:** Enforces strict Row Level Security (RLS) in PostgreSQL and includes logical safety thresholds (e.g., a 5L daily cap) inspired by industrial monitoring systems like the Driver Fatigue Detection System.

## 🛠️ Tech Stack

* **Frontend:** React 18 with TypeScript
* **State Management:** Zustand (Custom sync loops)
* **Backend & Auth:** Supabase (PostgreSQL)
* **Styling:** Tailwind CSS
* **Icons:** Lucide-React
* **Deployment:** Vercel (Edge network)

## 📦 Getting Started

### Prerequisites
* Node.js (v18+)
* A [Supabase](https://supabase.com/) account
* A [Vercel](https://vercel.com/) account (optional, for deployment)

### 1. Clone the repository
```bash
git clone [https://github.com/DineshTanikanti/HydrAI.git](https://github.com/DineshTanikanti/HydrAI.git)
cd HydrAI
2. Install dependencies
Bash
npm install
3. Environment Setup
Create a .env file in the root directory and add your Supabase credentials:

Code snippet
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
4. Database Setup (Supabase SQL)
To ensure the groups and logs work correctly, run the following SQL commands in your Supabase SQL Editor to set up the tables and Row Level Security (RLS) policies:

SQL
-- Create Groups Table
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create Group Members Join Table
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now()
);

-- Enable RLS and Policies
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups Access" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Members Access" ON public.group_members FOR ALL USING (true) WITH CHECK (true);
5. Run the Development Server
Bash
npm run dev
🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
