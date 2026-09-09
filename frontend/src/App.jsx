import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Academics from './pages/Academics';
import Staff from './pages/Staff';
import Gallery from './pages/Gallery';
import SchoolLife from './pages/SchoolLife';
import NewsEvents from './pages/NewsEvents';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';

// Placeholder for dashboard
const Dashboard = () => (
  <div className="container-custom py-16">
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <p className="text-gray-600 mt-4">Coming soon...</p>
  </div>
);

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/school-life" element={<SchoolLife />} />
          <Route path="/news" element={<NewsEvents />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;