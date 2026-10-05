import { Link } from 'react-router-dom';
import PostList from '../components/PostList';
import { useAuth } from '../context/AuthContext';

export default function MyPosts() {
  const { user } = useAuth();

  return (
    <>
      <div className="page-header">
        <h1>My Posts</h1>
        <Link to="/posts/new" className="btn">
          New Post
        </Link>
      </div>
      <PostList authorId={user._id} showActions />
    </>
  );
}
