import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  Timestamp, 
  serverTimestamp,
  DocumentData,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Skill, ConnectionRequest, Chat, Message, SkillProgress } from '../types';
import { RecentActivity, UpcomingSession } from '../types/dashboard';

// Collections
const USERS = 'users';
const SKILLS = 'skills';
const CONNECTION_REQUESTS = 'connectionRequests';
const SESSIONS = 'sessions';
const NOTIFICATIONS = 'notifications';
const ACTIVITIES = 'activities';
const CHATS = 'chats';
const MESSAGES = 'messages';
const SKILL_PROGRESS = 'skillProgress';

// Helper function to convert Firestore timestamp to Date
const convertTimestampToDate = (timestamp: any): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return undefined;
};

// User Functions
export const createUserDocument = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, USERS, user.id);
    
    // Check if document already exists
    const userDoc = await getDoc(userRef);
    
    // Convert dates to Firestore timestamps
    const userData = {
      ...user,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    
    if (!userDoc.exists()) {
      console.log(`Creating new user document for user ${user.id}`);
      await setDoc(userRef, userData);
    } else {
      console.log(`User document already exists for ${user.id}, merging data`);
      // Merge with existing data instead of overwriting
      await updateDoc(userRef, {
        ...userData,
        // Don't overwrite these arrays if they already exist
        skills: user.skills.length ? user.skills : userDoc.data().skills || [],
        desiredSkills: user.desiredSkills.length ? user.desiredSkills : userDoc.data().desiredSkills || [],
        connections: user.connections.length ? user.connections : userDoc.data().connections || [],
        connectionRequests: user.connectionRequests.length ? user.connectionRequests : userDoc.data().connectionRequests || [],
        // Don't reset rating
        rating: userDoc.data().rating || user.rating || 0,
        // Update the lastActive timestamp
        lastActive: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS, userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data() as DocumentData;
    
    // Convert Firestore timestamps to Date objects
    return {
      ...userData,
      lastActive: convertTimestampToDate(userData.lastActive),
      skills: userData.skills || [],
      desiredSkills: userData.desiredSkills || [],
      connections: userData.connections || [],
      connectionRequests: userData.connectionRequests || [],
      sessions: userData.sessions || [],
      notifications: userData.notifications || []
    } as User;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, USERS, userId);
    const userDoc = await getDoc(userRef);
    
    // If lastActive is being updated, convert to serverTimestamp
    const updateData = { ...data } as { [key: string]: any };
    if ('lastActive' in updateData) {
      updateData.lastActive = serverTimestamp();
    }
    
    if (!userDoc.exists()) {
      // Document doesn't exist, create it first
      console.log("Creating new user document as it doesn't exist");
      await setDoc(userRef, {
        id: userId,
        ...updateData,
        createdAt: serverTimestamp(),
        skills: updateData.skills || [],
        desiredSkills: updateData.desiredSkills || [],
        connections: updateData.connections || [],
        connectionRequests: updateData.connectionRequests || [],
        rating: updateData.rating || 0,
      });
    } else {
      // Document exists, update it
      await updateDoc(userRef, updateData);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Skills Functions
export const addSkill = async (skill: Skill): Promise<string> => {
  try {
    const skillCollection = collection(db, SKILLS);
    const skillRef = doc(skillCollection);
    const skillId = skillRef.id;
    
    await setDoc(skillRef, {
      ...skill,
      id: skillId,
      createdAt: serverTimestamp()
    });
    
    // Add the skill to the user's skills array
    const userRef = doc(db, USERS, skill.userId);
    await updateDoc(userRef, {
      skills: arrayUnion({ ...skill, id: skillId })
    });
    
    return skillId;
  } catch (error) {
    console.error('Error adding skill:', error);
    throw error;
  }
};

export const removeSkill = async (userId: string, skillId: string): Promise<void> => {
  try {
    // Get the user and find the skill to remove
    const userDoc = await getDoc(doc(db, USERS, userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const skills = userData.skills || [];
    const skillToRemove = skills.find((s: Skill) => s.id === skillId);
    
    if (!skillToRemove) {
      throw new Error('Skill not found');
    }
    
    // Remove the skill from the user's skills array
    await updateDoc(doc(db, USERS, userId), {
      skills: arrayRemove(skillToRemove)
    });
  } catch (error) {
    console.error('Error removing skill:', error);
    throw error;
  }
};

// Connection Functions
export const sendConnectionRequest = async (
  fromUserId: string, 
  toUserId: string, 
  exchangeDetails: { 
    message?: string;
    iWillLearn?: string;
    theyWillLearn?: string;
  } = {}
): Promise<string> => {
  try {
    // Create the connection request
    const requestCollection = collection(db, CONNECTION_REQUESTS);
    const requestRef = doc(requestCollection);
    const requestId = requestRef.id;
    
    const request: ConnectionRequest = {
      id: requestId,
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date(),
      message: exchangeDetails.message || '',
      exchangeDetails: {
        requesterWillLearn: exchangeDetails.iWillLearn || '',
        recipientWillLearn: exchangeDetails.theyWillLearn || ''
      }
    };
    
    await setDoc(requestRef, {
      ...request,
      createdAt: serverTimestamp()
    });
    
    // Add the request to the recipient's connection requests array
    const userRef = doc(db, USERS, toUserId);
    await updateDoc(userRef, {
      connectionRequests: arrayUnion(request)
    });
    
    // Create a notification for the recipient
    await createNotification(toUserId, {
      type: 'connection_request',
      relatedId: requestId,
      message: `You have a new connection request from ${fromUserId}`,
      read: false
    });
    
    return requestId;
  } catch (error) {
    console.error('Error sending connection request:', error);
    throw error;
  }
};

export const respondToConnectionRequest = async (userId: string, requestId: string, accept: boolean): Promise<void> => {
  try {
    // Get the user and find the request
    const userDoc = await getDoc(doc(db, USERS, userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const requests = userData.connectionRequests || [];
    const requestIndex = requests.findIndex((r: ConnectionRequest) => r.id === requestId);
    
    if (requestIndex === -1) {
      throw new Error('Connection request not found');
    }
    
    const request = requests[requestIndex];
    
    // Update the request status
    const updatedRequest = {
      ...request,
      status: accept ? 'accepted' : 'rejected'
    };
    
    const updatedRequests = [...requests];
    updatedRequests[requestIndex] = updatedRequest;
    
    await updateDoc(doc(db, USERS, userId), {
      connectionRequests: updatedRequests
    });
    
    // If accepted, add to both users' connections
    if (accept) {
      // Add to recipient's connections
      await updateDoc(doc(db, USERS, userId), {
        connections: arrayUnion(request.fromUserId)
      });
      
      // Add to sender's connections
      await updateDoc(doc(db, USERS, request.fromUserId), {
        connections: arrayUnion(userId)
      });
    }
    
    // Create a notification for the sender
    await createNotification(request.fromUserId, {
      type: 'connection_accepted',
      relatedId: requestId,
      message: accept
        ? `${userId} accepted your connection request`
        : `${userId} rejected your connection request`,
      read: false
    });
  } catch (error) {
    console.error('Error responding to connection request:', error);
    throw error;
  }
};

// Recent Activities Functions
export const getRecentActivities = async (userId: string, limitCount = 5): Promise<RecentActivity[]> => {
  try {
    const activitiesQuery = query(
      collection(db, ACTIVITIES),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitCount)
    );
    
    const snapshot = await getDocs(activitiesQuery);
    const activities: RecentActivity[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        ...data,
        id: doc.id,
        timestamp: convertTimestampToDate(data.timestamp) || new Date()
      } as RecentActivity);
    });
    
    return activities;
  } catch (error) {
    console.error('Error getting recent activities:', error);
    throw error;
  }
};

export const createActivity = async (activity: Omit<RecentActivity, 'id'>): Promise<string> => {
  try {
    const activitiesCollection = collection(db, ACTIVITIES);
    const activityRef = doc(activitiesCollection);
    const activityId = activityRef.id;
    
    await setDoc(activityRef, {
      ...activity,
      id: activityId,
      timestamp: serverTimestamp()
    });
    
    return activityId;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

// Upcoming Sessions Functions
export const getUpcomingSessions = async (userId: string, limitCount = 5): Promise<UpcomingSession[]> => {
  try {
    const now = new Date();
    
    // Get sessions where the user is either the initiator or recipient
    const sessionsQuery = query(
      collection(db, SESSIONS),
      where('status', 'in', ['scheduled', 'confirmed', 'pending']),
      where('scheduledTime', '>=', now),
      orderBy('scheduledTime', 'asc'),
      firestoreLimit(limitCount)
    );
    
    const snapshot = await getDocs(sessionsQuery);
    const sessions: UpcomingSession[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Determine if the user is the initiator or recipient
      const role = data.initiatorId === userId ? 'teacher' : 'student';
      
      sessions.push({
        id: doc.id,
        date: convertTimestampToDate(data.scheduledTime) || new Date(),
        skillId: data.skillId,
        partnerId: role === 'teacher' ? data.recipientId : data.initiatorId,
        role,
        status: data.status
      });
    });
    
    return sessions;
  } catch (error) {
    console.error('Error getting upcoming sessions:', error);
    throw error;
  }
};

// Notification Functions
export const createNotification = async (
  userId: string, 
  notification: { type: string; relatedId?: string; message: string; read: boolean }
): Promise<string> => {
  try {
    const notificationsCollection = collection(db, NOTIFICATIONS);
    const notificationRef = doc(notificationsCollection);
    const notificationId = notificationRef.id;
    
    await setDoc(notificationRef, {
      id: notificationId,
      userId,
      ...notification,
      createdAt: serverTimestamp()
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// User Discovery Functions
export const discoverUsers = async (
  userId: string, 
  filters: {
    skillIds?: string[],
    query?: string,
    includedSkillTypes?: 'teaching' | 'learning' | 'both',
    limit?: number
  } = {}
): Promise<User[]> => {
  try {
    // Query all users except the current user
    let usersQuery = query(collection(db, USERS), where('id', '!=', userId));
    
    // Get user's connections to exclude them from results
    const userDoc = await getDoc(doc(db, USERS, userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const connections = userData?.connections || [];
    const pendingRequestIds = (userData?.connectionRequests || [])
      .filter((req: ConnectionRequest) => req.status === 'pending')
      .map((req: ConnectionRequest) => req.fromUserId);
    
    // Get the current user's skills and desired skills
    const userSkills = userData?.skills || [];
    const userDesiredSkills = userData?.desiredSkills || [];
    
    const snapshot = await getDocs(usersQuery);
    let users: User[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const user = {
        ...data,
        id: doc.id,
        lastActive: convertTimestampToDate(data.lastActive),
        skills: data.skills || [],
        desiredSkills: data.desiredSkills || [],
        connections: data.connections || [],
        connectionRequests: data.connectionRequests || []
      } as User;
      
      // Skip users that are already connected
      if (connections.includes(user.id)) {
        return;
      }
      
      // Skip users that have a pending connection request
      if (pendingRequestIds.includes(user.id)) {
        return;
      }
      
      users.push(user);
    });
    
    // Apply filters after fetching all users
    let filteredUsers = users;
    
    // 1. Filter by skill IDs if specified
    if (filters.skillIds && filters.skillIds.length > 0) {
      filteredUsers = filteredUsers.filter(user => 
        user.skills.some(skill => filters.skillIds?.includes(skill.id))
      );
    }
    
    // 2. Apply search query if provided
    if (filters.query && filters.query.trim() !== '') {
      const query = filters.query.toLowerCase().trim();
      filteredUsers = filteredUsers.filter(user => 
        user.displayName.toLowerCase().includes(query) ||
        user.bio?.toLowerCase().includes(query) ||
        user.skills.some(skill => skill.name.toLowerCase().includes(query)) ||
        user.desiredSkills.some(skill => skill.name.toLowerCase().includes(query))
      );
    }
    
    // 3. Filter by skill type match (teaching/learning compatibility)
    if (filters.includedSkillTypes) {
      if (filters.includedSkillTypes === 'teaching') {
        // Users who can teach what current user wants to learn
        filteredUsers = filteredUsers.filter(user => 
          user.skills.some(skill => 
            userDesiredSkills.some((desiredSkill: Skill) => 
              desiredSkill.name.toLowerCase() === skill.name.toLowerCase()
            )
          )
        );
      } else if (filters.includedSkillTypes === 'learning') {
        // Users who want to learn what current user can teach
        filteredUsers = filteredUsers.filter(user => 
          user.desiredSkills.some((desiredSkill: Skill) => 
            userSkills.some((skill: Skill) => 
              skill.name.toLowerCase() === desiredSkill.name.toLowerCase()
            )
          )
        );
      } else if (filters.includedSkillTypes === 'both') {
        // Users with either teaching or learning compatibility
        filteredUsers = filteredUsers.filter(user => 
          // Either they can teach what I want to learn
          user.skills.some((skill: Skill) => 
            userDesiredSkills.some((desiredSkill: Skill) => 
              desiredSkill.name.toLowerCase() === skill.name.toLowerCase()
            )
          ) ||
          // Or they want to learn what I can teach
          user.desiredSkills.some((desiredSkill: Skill) => 
            userSkills.some((skill: Skill) => 
              skill.name.toLowerCase() === desiredSkill.name.toLowerCase()
            )
          )
        );
      }
    }
    
    // Apply limit if specified
    if (filters.limit && filters.limit > 0) {
      filteredUsers = filteredUsers.slice(0, filters.limit);
    }
    
    return filteredUsers;
  } catch (error) {
    console.error('Error discovering users:', error);
    throw error;
  }
};

// Function to fetch user details by ID
export const getUserDetailsById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS, userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    const user = {
      ...data,
      id: userDoc.id,
      lastActive: convertTimestampToDate(data.lastActive),
      skills: data.skills || [],
      desiredSkills: data.desiredSkills || [],
      connections: data.connections || [],
      connectionRequests: data.connectionRequests || []
    } as User;
    
    return user;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

// Chat Functions
export const createChat = async (participants: string[], skillExchangeId?: string, title?: string): Promise<string> => {
  try {
    const chatCollection = collection(db, CHATS);
    const chatRef = doc(chatCollection);
    const chatId = chatRef.id;
    
    // Create chat object and remove undefined fields
    const chatData: any = {
      id: chatId,
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Only add these fields if they're defined
    if (skillExchangeId) chatData.skillExchangeId = skillExchangeId;
    if (title) chatData.title = title;
    
    // Set the document with the cleaned data
    await setDoc(chatRef, chatData);
    
    // Add the chat reference to each participant's user document
    for (const userId of participants) {
      const userRef = doc(db, USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Check if user already has a chats array
        const userData = userDoc.data();
        if (userData.chats) {
          // Use arrayUnion to add the chat ID to the user's chats array
          await updateDoc(userRef, {
            chats: arrayUnion(chatId)
          });
        } else {
          // Create a new chats array
          await updateDoc(userRef, {
            chats: [chatId]
          });
        }
        
        // Create a notification for each participant
        await createNotification(userId, {
          type: 'system',
          message: title 
            ? `You have been added to chat: ${title}` 
            : 'You have been added to a new chat',
          read: false
        });
      }
    }
    
    return chatId;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const sendMessage = async (chatId: string, senderId: string, content: string, attachments?: string[]): Promise<string> => {
  try {
    // Create the message
    const messageCollection = collection(db, CHATS, chatId, MESSAGES);
    const messageRef = doc(messageCollection);
    const messageId = messageRef.id;
    
    const message = {
      id: messageId,
      chatId,
      senderId,
      content,
      timestamp: serverTimestamp(),
      read: false,
      attachments: attachments || []
    };
    
    await setDoc(messageRef, message);
    
    // Update the chat's lastMessage and updatedAt
    const chatRef = doc(db, CHATS, chatId);
    await updateDoc(chatRef, {
      lastMessage: {
        id: messageId,
        senderId,
        content,
        timestamp: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
    
    // Get the chat to find other participants
    const chatDoc = await getDoc(chatRef);
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      const otherParticipants = chatData.participants.filter((id: string) => id !== senderId);
      
      // Create notifications for other participants
      for (const userId of otherParticipants) {
        await createNotification(userId, {
          type: 'system',
          relatedId: chatId,
          message: `New message from ${senderId}`,
          read: false
        });
      }
    }
    
    return messageId;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getChatMessages = async (chatId: string, limit = 50): Promise<Message[]> => {
  try {
    const messagesQuery = query(
      collection(db, CHATS, chatId, MESSAGES),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );
    
    const snapshot = await getDocs(messagesQuery);
    const messages: Message[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        ...data,
        id: doc.id,
        timestamp: convertTimestampToDate(data.timestamp) || new Date()
      } as Message);
    });
    
    // Return messages in chronological order (oldest first)
    return messages.reverse();
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
};

export const getUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const chatsQuery = query(
      collection(db, CHATS),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(chatsQuery);
    const chats: Chat[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      chats.push({
        ...data,
        id: doc.id,
        createdAt: convertTimestampToDate(data.createdAt) || new Date(),
        updatedAt: convertTimestampToDate(data.updatedAt) || new Date(),
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          timestamp: convertTimestampToDate(data.lastMessage.timestamp) || new Date()
        } : undefined
      } as Chat);
    });
    
    return chats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
};

export const markMessagesAsRead = async (chatId: string, userId: string): Promise<void> => {
  try {
    const messagesQuery = query(
      collection(db, CHATS, chatId, MESSAGES),
      where('read', '==', false),
      where('senderId', '!=', userId)
    );
    
    const snapshot = await getDocs(messagesQuery);
    
    // Batch update all unread messages
    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      const messageRef = doc.ref;
      batch.update(messageRef, { read: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Skill Progress Functions
export const createSkillProgress = async (skillExchangeId: string, milestones: { title: string }[]): Promise<string> => {
  try {
    const progressCollection = collection(db, SKILL_PROGRESS);
    const progressRef = doc(progressCollection);
    const progressId = progressRef.id;
    
    const formattedMilestones = milestones.map((milestone, index) => ({
      id: `milestone-${index}`,
      title: milestone.title,
      completed: false
    }));
    
    const skillProgress = {
      id: progressId,
      skillExchangeId,
      progressPercentage: 0,
      milestones: formattedMilestones,
      notes: '',
      updatedAt: serverTimestamp()
    };
    
    await setDoc(progressRef, skillProgress);
    
    return progressId;
  } catch (error) {
    console.error('Error creating skill progress:', error);
    throw error;
  }
};

export const updateSkillProgress = async (progressId: string, updates: Partial<SkillProgress>): Promise<void> => {
  try {
    const progressRef = doc(db, SKILL_PROGRESS, progressId);
    
    // If updating milestones, recalculate progress percentage
    if (updates.milestones) {
      const completedCount = updates.milestones.filter(m => m.completed).length;
      const totalCount = updates.milestones.length;
      updates.progressPercentage = Math.round((completedCount / totalCount) * 100);
    }
    
    await updateDoc(progressRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    // Get the skill exchange to notify participants
    const progressDoc = await getDoc(progressRef);
    if (progressDoc.exists()) {
      const progressData = progressDoc.data();
      const exchangeId = progressData.skillExchangeId;
      
      // Get the skill exchange
      const exchangeDoc = await getDoc(doc(db, 'skillExchanges', exchangeId));
      if (exchangeDoc.exists()) {
        const exchangeData = exchangeDoc.data();
        
        // Notify teacher and student about progress update
        await createNotification(exchangeData.teacherId, {
          type: 'system',
          relatedId: exchangeId,
          message: `Skill progress has been updated to ${updates.progressPercentage}%`,
          read: false
        });
        
        await createNotification(exchangeData.studentId, {
          type: 'system',
          relatedId: exchangeId,
          message: `Skill progress has been updated to ${updates.progressPercentage}%`,
          read: false
        });
      }
    }
  } catch (error) {
    console.error('Error updating skill progress:', error);
    throw error;
  }
};

export const getSkillProgress = async (skillExchangeId: string): Promise<SkillProgress | null> => {
  try {
    const progressQuery = query(
      collection(db, SKILL_PROGRESS),
      where('skillExchangeId', '==', skillExchangeId),
      firestoreLimit(1)
    );
    
    const snapshot = await getDocs(progressQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    const data = snapshot.docs[0].data();
    return {
      ...data,
      id: snapshot.docs[0].id,
      updatedAt: convertTimestampToDate(data.updatedAt) || new Date()
    } as SkillProgress;
  } catch (error) {
    console.error('Error getting skill progress:', error);
    throw error;
  }
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatRef = doc(db, CHATS, chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      return null;
    }
    
    const data = chatDoc.data();
    return {
      ...data,
      id: chatDoc.id,
      createdAt: convertTimestampToDate(data.createdAt) || new Date(),
      updatedAt: convertTimestampToDate(data.updatedAt) || new Date(),
      lastMessage: data.lastMessage ? {
        ...data.lastMessage,
        timestamp: convertTimestampToDate(data.lastMessage.timestamp) || new Date()
      } : undefined
    } as Chat;
  } catch (error) {
    console.error('Error getting chat by ID:', error);
    throw error;
  }
};

// Create a skill exchange (teaching/learning arrangement)
export const createSkillExchange = async (
  teacherId: string,
  studentId: string,
  skillId: string
): Promise<string> => {
  try {
    const exchangesCollection = collection(db, 'skillExchanges');
    const exchangeRef = doc(exchangesCollection);
    const exchangeId = exchangeRef.id;
    
    const skillExchange = {
      id: exchangeId,
      teacherId,
      studentId,
      skillId,
      status: 'pending',
      startDate: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    
    await setDoc(exchangeRef, skillExchange);
    
    // Create notifications for both users
    const teacherDoc = await getDoc(doc(db, USERS, teacherId));
    const studentDoc = await getDoc(doc(db, USERS, studentId));
    
    if (teacherDoc.exists() && studentDoc.exists()) {
      const teacherData = teacherDoc.data();
      const studentData = studentDoc.data();
      
      // Notification for teacher
      await createNotification(teacherId, {
        type: 'skill_exchange',
        relatedId: exchangeId,
        message: `${studentData.displayName} wants to learn a skill from you.`,
        read: false
      });
      
      // Notification for student
      await createNotification(studentId, {
        type: 'skill_exchange',
        relatedId: exchangeId,
        message: `You requested to learn from ${teacherData.displayName}.`,
        read: false
      });
    }
    
    return exchangeId;
  } catch (error) {
    console.error('Error creating skill exchange:', error);
    throw error;
  }
};

// Update skill exchange status
export const updateSkillExchangeStatus = async (
  exchangeId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
): Promise<void> => {
  try {
    const exchangeRef = doc(db, 'skillExchanges', exchangeId);
    
    await updateDoc(exchangeRef, {
      status,
      ...(status === 'in_progress' ? { startDate: serverTimestamp() } : {}),
      ...(status === 'completed' ? { endDate: serverTimestamp() } : {})
    });
    
    // Create notifications for status change
    const exchangeDoc = await getDoc(exchangeRef);
    if (exchangeDoc.exists()) {
      const exchangeData = exchangeDoc.data();
      const teacherId = exchangeData.teacherId;
      const studentId = exchangeData.studentId;
      
      // Get user names
      const teacherDoc = await getDoc(doc(db, USERS, teacherId));
      const studentDoc = await getDoc(doc(db, USERS, studentId));
      
      if (teacherDoc.exists() && studentDoc.exists()) {
        const teacherData = teacherDoc.data();
        const studentData = studentDoc.data();
        
        let teacherMessage = '';
        let studentMessage = '';
        
        switch (status) {
          case 'in_progress':
            teacherMessage = `You've started teaching ${studentData.displayName}.`;
            studentMessage = `Your learning session with ${teacherData.displayName} has started.`;
            break;
            
          case 'completed':
            teacherMessage = `Your teaching session with ${studentData.displayName} is complete.`;
            studentMessage = `Your learning session with ${teacherData.displayName} is complete. Please rate your experience.`;
            break;
            
          case 'cancelled':
            teacherMessage = `Teaching session with ${studentData.displayName} was cancelled.`;
            studentMessage = `Learning session with ${teacherData.displayName} was cancelled.`;
            break;
        }
        
        // Create notifications
        if (teacherMessage) {
          await createNotification(teacherId, {
            type: 'skill_exchange',
            relatedId: exchangeId,
            message: teacherMessage,
            read: false
          });
        }
        
        if (studentMessage) {
          await createNotification(studentId, {
            type: 'skill_exchange',
            relatedId: exchangeId,
            message: studentMessage,
            read: false
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating skill exchange status:', error);
    throw error;
  }
};

// Initiate a teaching/learning session between connected users
export const initiateSession = async (
  initiatorId: string,
  recipientId: string,
  skillId: string,
  scheduledTime?: Date,
  notes?: string
): Promise<string> => {
  try {
    // Create a new session document
    const sessionsCollection = collection(db, SESSIONS);
    const sessionRef = doc(sessionsCollection);
    const sessionId = sessionRef.id;
    
    // Prepare the session data
    const sessionData: any = {
      id: sessionId,
      initiatorId,
      recipientId,
      skillId,
      status: 'pending',
      createdAt: serverTimestamp(),
      notes: notes || ''
    };
    
    // Add scheduled time if provided
    if (scheduledTime) {
      sessionData.scheduledTime = Timestamp.fromDate(scheduledTime);
    }
    
    // Create the session in Firestore
    await setDoc(sessionRef, sessionData);
    
    // Get user details for notifications
    const initiatorDoc = await getDoc(doc(db, USERS, initiatorId));
    const recipientDoc = await getDoc(doc(db, USERS, recipientId));
    
    if (initiatorDoc.exists() && recipientDoc.exists()) {
      const initiatorData = initiatorDoc.data();
      const recipientData = recipientDoc.data();
      
      // Get skill details
      const skillDoc = await getDoc(doc(db, SKILLS, skillId));
      const skillName = skillDoc.exists() ? skillDoc.data().name : 'a skill';
      
      // Create notification for recipient
      await createNotification(recipientId, {
        type: 'session_request',
        relatedId: sessionId,
        message: `${initiatorData.displayName} has invited you to a ${skillName} session${
          scheduledTime ? ` on ${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString()}` : ''
        }`,
        read: false
      });
      
      // Create activity record
      await createActivity({
        userId: initiatorId,
        type: 'skill_added',
        description: `You initiated a ${skillName} session with ${recipientData.displayName}`,
        timestamp: new Date(),
        relatedSkillId: skillId
      });
    }
    
    return sessionId;
  } catch (error) {
    console.error('Error initiating session:', error);
    throw error;
  }
};

// Rate a skill exchange
export const rateSkillExchange = async (
  exchangeId: string,
  rating: number,
  feedback: string = ''
): Promise<void> => {
  try {
    const exchangeRef = doc(db, 'skillExchanges', exchangeId);
    
    // Update the exchange with rating
    await updateDoc(exchangeRef, {
      rating,
      feedback,
      ratedAt: serverTimestamp()
    });
    
    // Update teacher's average rating
    const exchangeDoc = await getDoc(exchangeRef);
    if (exchangeDoc.exists()) {
      const exchangeData = exchangeDoc.data();
      const teacherId = exchangeData.teacherId;
      
      // Get all completed exchanges for this teacher
      const teacherExchangesQuery = query(
        collection(db, 'skillExchanges'),
        where('teacherId', '==', teacherId),
        where('status', '==', 'completed'),
        where('rating', '!=', null)
      );
      
      const exchangesSnapshot = await getDocs(teacherExchangesQuery);
      let totalRating = 0;
      let count = 0;
      
      exchangesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.rating) {
          totalRating += data.rating;
          count++;
        }
      });
      
      const averageRating = count > 0 ? totalRating / count : 0;
      
      // Update teacher's rating
      const teacherRef = doc(db, USERS, teacherId);
      await updateDoc(teacherRef, {
        rating: averageRating
      });
      
      // Create notification for teacher
      await createNotification(teacherId, {
        type: 'rating',
        relatedId: exchangeId,
        message: `You received a new rating: ${rating}/5`,
        read: false
      });
    }
  } catch (error) {
    console.error('Error rating skill exchange:', error);
    throw error;
  }
};

// Get user's skill exchanges
export const getUserSkillExchanges = async (
  userId: string,
  role: 'teacher' | 'student' | 'both' = 'both',
  status: 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled' = 'all'
): Promise<any[]> => {
  try {
    const exchanges: any[] = [];
    
    // Get exchanges where user is teacher
    if (role === 'teacher' || role === 'both') {
      const teacherQuery = query(
        collection(db, 'skillExchanges'),
        where('teacherId', '==', userId),
        ...(status !== 'all' ? [where('status', '==', status)] : [])
      );
      
      const teacherSnapshot = await getDocs(teacherQuery);
      
      teacherSnapshot.forEach((doc) => {
        exchanges.push({
          ...doc.data(),
          id: doc.id,
          role: 'teacher'
        });
      });
    }
    
    // Get exchanges where user is student
    if (role === 'student' || role === 'both') {
      const studentQuery = query(
        collection(db, 'skillExchanges'),
        where('studentId', '==', userId),
        ...(status !== 'all' ? [where('status', '==', status)] : [])
      );
      
      const studentSnapshot = await getDocs(studentQuery);
      
      studentSnapshot.forEach((doc) => {
        exchanges.push({
          ...doc.data(),
          id: doc.id,
          role: 'student'
        });
      });
    }
    
    // Sort by start date, most recent first
    exchanges.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate.seconds * 1000) : new Date(0);
      const dateB = b.startDate ? new Date(b.startDate.seconds * 1000) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    return exchanges;
  } catch (error) {
    console.error('Error getting skill exchanges:', error);
    throw error;
  }
}; 