import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, AlertCircle, XCircle, AlertTriangle, Ban, WifiOff, KeyRound, UserX } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [errorType, setErrorType] = useState<
    | 'invalid-credential'
    | 'user-not-found'
    | 'wrong-password'
    | 'too-many-requests'
    | 'network'
    | 'user-disabled'
    | 'invalid-email'
    | 'unknown'
    | null
  >(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Mouse position tracking for parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left - width / 2);
    mouseY.set(clientY - top - height / 2);
  };

  const springConfig = { damping: 20, stiffness: 100 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(springY, [-200, 200], [5, -5]);
  const rotateY = useTransform(springX, [-200, 200], [-5, 5]);

  const getErrorDetails = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-credential':
        return {
          message: 'Invalid email or password. Please check your credentials.',
          type: 'invalid-credential' as const,
          icon: <KeyRound className="w-5 h-5 flex-shrink-0" />
        };
      case 'auth/user-not-found':
        return {
          message: 'No account found with this email.',
          type: 'user-not-found' as const,
          icon: <UserX className="w-5 h-5 flex-shrink-0" />
        };
      case 'auth/wrong-password':
        return {
          message: 'Incorrect password. Please try again.',
          type: 'wrong-password' as const,
          icon: <KeyRound className="w-5 h-5 flex-shrink-0" />
        };
      case 'auth/too-many-requests':
        return {
          message: 'Too many failed attempts. Please try again later.',
          type: 'too-many-requests' as const,
          icon: <Ban className="w-5 h-5 flex-shrink-0" />
        };
      case 'auth/network-request-failed':
        return {
          message: 'Network error. Please check your connection.',
          type: 'network' as const,
          icon: <WifiOff className="w-5 h-5 flex-shrink-0" />
        };
      case 'auth/user-disabled':
        return {
          message: 'This account has been disabled. Please contact support.',
          type: 'user-disabled' as const,
          icon: <Ban className="w-5 h-5 flex-shrink-0" />
        };
      case 'auth/invalid-email':
        return {
          message: 'Invalid email format. Please enter a valid email.',
          type: 'invalid-email' as const,
          icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        };
      default:
        return {
          message: 'An unexpected error occurred. Please try again.',
          type: 'unknown' as const,
          icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setErrorType('invalid-credential');
      setLoading(false);
      return;
    }

    try {
      await signIn(email, password);
      navigate('/');
    } catch (error: any) {
      const errorDetails = getErrorDetails(error.code);
      setError(errorDetails.message);
      setErrorType(errorDetails.type);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950 flex items-center justify-center px-4 py-12 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-primary-500/10 to-transparent rounded-full blur-3xl"
          style={{
            x: useTransform(springX, [-200, 200], [-50, 50]),
            y: useTransform(springY, [-200, 200], [-50, 50]),
          }}
        />
        <motion.div 
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-primary-500/10 to-transparent rounded-full blur-3xl"
          style={{
            x: useTransform(springX, [-200, 200], [50, -50]),
            y: useTransform(springY, [-200, 200], [50, -50]),
          }}
        />
        {/* Floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary-500/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              x: useTransform(springX, [-200, 200], [-10, 10]),
              y: useTransform(springY, [-200, 200], [-10, 10]),
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-zinc-800/50">
          <div className="text-center mb-8">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-display font-semibold text-white mb-2"
            >
              Welcome Back
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-zinc-400 font-sans"
            >
              Sign in to continue to your account
            </motion.p>
          </div>
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`flex items-center gap-3 p-4 rounded-lg mb-6 text-sm font-sans ${
                  errorType === 'invalid-credential' || errorType === 'wrong-password'
                    ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                    : errorType === 'network'
                    ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500'
                    : errorType === 'too-many-requests' || errorType === 'user-disabled'
                    ? 'bg-orange-500/10 border border-orange-500/20 text-orange-500'
                    : errorType === 'user-not-found'
                    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-500'
                    : errorType === 'invalid-email'
                    ? 'bg-purple-500/10 border border-purple-500/20 text-purple-500'
                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                }`}
              >
                <motion.div
                  initial={{ rotate: -90 }}
                  animate={{ rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {errorType && getErrorDetails(errorType ? `auth/${errorType}` : '').icon}
                </motion.div>
                <p className="flex-1">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setError('');
                    setErrorType(null);
                  }}
                  className="text-current opacity-70 hover:opacity-100 transition-opacity"
                >
                  <XCircle className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label htmlFor="email" className="text-sm font-medium text-zinc-300 font-sans">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-sans"
                  placeholder="Enter your email"
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <label htmlFor="password" className="text-sm font-medium text-zinc-300 font-sans">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-sans"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800/50 text-primary-500 focus:ring-primary-500"
                />
                <label htmlFor="remember" className="ml-2 text-zinc-400 font-sans">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-primary-500 hover:text-primary-400 transition-colors font-sans"
              >
                Forgot password?
              </Link>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              type="submit"
              disabled={loading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-sans group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <motion.span
                    animate={{ x: isHovered ? 5 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <ArrowRight size={20} />
                  </motion.span>
                </>
              )}
            </motion.button>
          </form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-zinc-400 font-sans">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-primary-500 hover:text-primary-400 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </motion.div>

          <motion.p 
            className="mt-4 text-center text-zinc-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-500 hover:text-primary-400 font-medium">
              Sign up
            </Link>
            {' '}to share your skills and start learning!
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login; 