import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, setCurrentUser } from '../api/auth';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    password2: '',
    role: 'parent'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      const { user } = response.data;
      
      // Store user data
      setCurrentUser(user);
      
      // Redirect to login
      navigate('/login');
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        const firstError = Object.values(errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">Create Account</h2>
          <p className="mt-2 text-center text-gray-600">Join our school community</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="John"
              />
            </div>
            <div>
              <label className="label-field">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="label-field">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="parent@example.com"
            />
          </div>

          <div>
            <label className="label-field">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label className="label-field">Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="input-field"
              placeholder="+254 712 345 678"
            />
          </div>

          <div>
            <label className="label-field">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field"
            >
              <option value="parent">Parent</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label className="label-field">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="label-field">Confirm Password</label>
            <input
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;