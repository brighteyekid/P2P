import { motion } from 'framer-motion';
import { DashboardContentProps } from '../../types/dashboard';
import { format } from 'date-fns';
import { FiClock, FiUser, FiBook } from 'react-icons/fi';

const DashboardContent = ({ activeTab, userData, recentActivities = [], upcomingSessions = [] }: DashboardContentProps) => {
  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-zinc-800/50 rounded-xl p-6"
      >
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <FiClock className="mr-2" />
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50"
              >
                <div className="flex-1">
                  <p className="text-zinc-300">{activity.description}</p>
                  <p className="text-sm text-zinc-500">
                    {format(activity.timestamp instanceof Date ? activity.timestamp : new Date(activity.timestamp), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-zinc-400">No recent activity</p>
          )}
        </div>
      </motion.div>

      {/* Upcoming Sessions */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-zinc-800/50 rounded-xl p-6"
      >
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <FiBook className="mr-2" />
          Upcoming Sessions
        </h3>
        <div className="space-y-4">
          {upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-300">
                      Session with{' '}
                      <span className="text-primary-500">{session.partnerId}</span>
                    </p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        session.status === 'confirmed'
                          ? 'bg-green-500/10 text-green-500'
                          : session.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500">
                    {format(session.date instanceof Date ? session.date : new Date(session.date), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-zinc-400">No upcoming sessions</p>
          )}
        </div>
      </motion.div>
    </div>
  );

  const renderSkills = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-medium text-white mb-4">My Skills</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userData?.skills?.map((skill, index) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50"
          >
            <h4 className="text-white font-medium mb-2">{skill.name}</h4>
            <p className="text-zinc-400 text-sm mb-3">
              {skill.category} • {skill.level}
            </p>
            <div className="flex flex-wrap gap-2">
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs rounded-full bg-zinc-700/50 text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderConnections = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-medium text-white mb-4">My Connections</h3>
      {userData?.connections?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userData.connections.map((connection, index) => (
            <motion.div
              key={connection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 flex items-center space-x-3"
            >
              <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                <FiUser className="text-primary-500" />
              </div>
              <div>
                <p className="text-white font-medium">{connection}</p>
                <p className="text-sm text-zinc-400">Connected</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-zinc-400">No connections yet</p>
      )}
    </motion.div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'skills':
        return renderSkills();
      case 'connections':
        return renderConnections();
      default:
        return null;
    }
  };

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      {renderContent()}
    </motion.div>
  );
};

export default DashboardContent; 