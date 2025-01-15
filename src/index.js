import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App';
import SignUp from './pages/signup';
import SignIn from './pages/signin';
import Profile from './pages/profile';
import Saved from './pages/saved';
import MyBlogs from './pages/myblogs';
import NotificationsPage from './pages/notifpage';
import Repass from './pages/repass';
import BlogContent from './pages/Content';
import ProtectedRoute from './components/ProtectedRoute';
import './i18n';
import BlogEditor from './pages/newBlogEditor';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/signup',
    element: <SignUp />,
  },
  {
    path: '/signin',
    element: <SignIn />,
  },
  {
    path: '/content/:id',
    element: <BlogContent />,
  },
  {
    path: '/beditor', //
    element: (
      <ProtectedRoute>
        <BlogEditor />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile', //
    element:  <ProtectedRoute> 
      <Profile />
      </ProtectedRoute>,
  },
  {
    path: '/saved', //
    element: <ProtectedRoute>
      <Saved />
    </ProtectedRoute>,
  },
  {
    path: '/myblogs', //
    element: <ProtectedRoute>
      <MyBlogs />
    </ProtectedRoute>,
  },
  {
    path: '/notifpage', //
    element: <ProtectedRoute>
      <NotificationsPage />
    </ProtectedRoute>,
  },
  {
    path: '/repass',
    element: <Repass />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
