import { IconType } from 'react-icons';
import {  User } from './index';

export interface DashboardTab {
  id: string;
  label: string;
  icon: IconType;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: number | string;
  icon: IconType;
  color: string;
  link: string;
}

export interface RecentActivity {
  id: string;
  type: 'skill_added' | 'connection_made' | 'session_completed' | 'rating_received';
  timestamp: Date;
  description: string;
  relatedUserId?: string;
  relatedSkillId?: string;
  userId: string;
}

export interface UpcomingSession {
  id: string;
  date: Date;
  skillId: string;
  partnerId: string;
  role: 'teacher' | 'student';
  status: 'scheduled' | 'confirmed' | 'pending';
}

export interface DashboardProps {
  userData: User | null;
  recentActivities?: RecentActivity[];
  upcomingSessions?: UpcomingSession[];
}

export interface DashboardContentProps {
  activeTab: string;
  userData: User | null;
  recentActivities?: RecentActivity[];
  upcomingSessions?: UpcomingSession[];
} 