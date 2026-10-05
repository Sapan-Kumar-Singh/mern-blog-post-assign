import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getAccessToken } from '../api/client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Real-time notifications (e.g. someone commented on your post) shown as toasts
export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return undefined;

    // auth as a function so reconnects always use the latest access token
    const socket = io(SOCKET_URL, { auth: (cb) => cb({ token: getAccessToken() }) });

    socket.on('notification', (notification) => {
      const id = `${Date.now()}-${Math.random()}`;
      setNotifications((prev) => [...prev, { ...notification, id }]);
      setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 6000);
    });

    return () => socket.disconnect();
  }, [user]);

  if (!notifications.length) return null;

  return (
    <div className="toasts">
      {notifications.map((n) => (
        <div key={n.id} className="toast">
          <span>{n.message}</span>
          {n.postSlug && <Link to={`/posts/${n.postSlug}`}>View</Link>}
        </div>
      ))}
    </div>
  );
}
