export type SkillLevel = 'Beginner' | 'Intermediate' | 'Expert';

export type SkillCategory = {
  id: string;
  name: string;
  description: string;
};

export type Skill = {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  tags: string[];
  userId: string;
};

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export type ConnectionRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: ConnectionStatus;
  createdAt: Date;
  message?: string;
  exchangeDetails?: {
    requesterWillLearn: string;
    recipientWillLearn: string;
  };
};

export type Connection = {
  id: string;
  userId: string;
  connectedUserId: string;
  createdAt: Date;
  skills: string[]; // Skills the connected user is offering
  desiredSkills: string[]; // Skills the connected user wants to learn
};

export type Session = {
  id: string;
  initiatorId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  scheduledTime?: Date;
  completedTime?: Date;
  notes?: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: 'connection_request' | 'connection_accepted' | 'session_request' | 'session_accepted' | 'system';
  relatedId?: string; // ID of the related connection, session, etc.
  message: string;
  read: boolean;
  createdAt: Date;
};

export type User = {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  skills: Skill[];
  desiredSkills: Skill[];
  rating: number;
  connections: string[];
  connectionRequests: ConnectionRequest[];
  lastActive?: Date;
  sessions?: Session[];
  notifications?: Notification[];
  chats?: string[]; // IDs of chats the user is participating in
};

export type SkillExchange = {
  id: string;
  teacherId: string;
  studentId: string;
  skillId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  rating?: number;
  feedback?: string;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: string[];
};

export type Chat = {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
  skillExchangeId?: string; // Optional reference to a skill exchange
  title?: string;
};

export type SkillProgress = {
  id: string;
  skillExchangeId: string;
  progressPercentage: number;
  milestones: {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
  }[];
  notes: string;
  updatedAt: Date;
};

export type ActivityType = 
  | 'skill_added' 
  | 'connection_made' 
  | 'session_completed' 
  | 'session_initiated'
  | 'rating_received'; 