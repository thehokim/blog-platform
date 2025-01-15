import React from 'react';
import Blogs from './components/blogs';
import Footer from './components/footer';
import Navbar from './components/navbar';

function App() {
  // localStorage.setItem('token', 'MYCUSTOMTOKEN');

  // console.log(first)

  return (
    <div className='App'>
      <Navbar />
      <Blogs />
      <Footer />
    </div>
  );
}

export default App;
