import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { parentAuthAPI } from '../api/auth';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [phase, setPhase] = useState('loading'); // loading | invalid | form | success
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    national_id: '',
    student_dob: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  // Validate the token on mount
  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setError('No invitation token provided.');
        setPhase('invalid');
        return;
      }
      try {
        const res = await parentAuthAPI.validateInvitation(token);
        setInvitation(res.data);
        setPhase('form');
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          'This invitation is invalid or has expired.';
        setError(msg);
        setPhase('invalid');
      }
    };
    validate();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (formData.password !== formData.confirm_password) {
      setFieldErrors({ confirm_password: 'Passwords do not match.' });
      return;
    }
    if (formData.password.length < 8) {
      setFieldErrors({ password: 'Password must be at least 8 characters.' });
      return;
    }

    setSubmitting(true);
    try {
      await parentAuthAPI.acceptInvitation(token, formData);
      setPhase('success');
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      const data = err.response?.data || {};
      if (typeof data === 'object' && !data.error) {
        // Field-level errors
        setFieldErrors(data);
      } else {
        setError(data.error || 'Failed to accept invitation. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // -------- Render --------

  const renderHero = () => (
    <div className="hidden lg:block lg:w-1/2 relative overflow-hidden min-h-screen">
      <img src="/hero.png" alt="Arina School" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary-900/95 via-primary-900/60 to-primary-900/30"></div>
      <div className="absolute bottom-12 left-8 right-8 z-10 text-white">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-accent-400 font-semibold text-sm tracking-widest uppercase mb-3">
          <span>Knowledge</span>
          <span>•</span>
          <span>Discipline</span>
          <span>•</span>
          <span>Success</span>
        </div>
        <h2 className="text-3xl font-bold mb-2">One account, full visibility</h2>
        <p className="text-white/80 text-sm">
          Track your child's academic journey securely.
        </p>
      </div>
    </div>
  );

  const renderShell = (inner) => (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {renderHero()}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-6 sm:p-12 min-h-screen">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.png" alt="Arina School" className="h-20 mb-3" />
            <p className="text-xs tracking-widest text-primary-900 font-semibold uppercase">
              Parent Portal
            </p>
          </div>
          {inner}
        </div>
      </div>
    </div>
  );

  // ----------- Loading -----------
  if (phase === 'loading') {
    return renderShell(
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying your invitation...</p>
      </div>
    );
  }

  // ----------- Invalid -----------
  if (phase === 'invalid') {
    return renderShell(
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Not Valid</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link to="/login" className="btn-primary inline-block">Back to Login</Link>
      </div>
    );
  }

  // ----------- Success -----------
  if (phase === 'success') {
    return renderShell(
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h1>
        <p className="text-gray-600 mb-6">
          Redirecting you to the login page...
        </p>
        <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
      </div>
    );
  }

  // ----------- Form -----------
  return renderShell(
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-900 mb-2">Accept Invitation</h1>
        <p className="text-gray-500">
          Welcome, {invitation?.guardian_relationship?.toLowerCase()}{' '}
          <strong>{invitation?.guardian_name_hint}</strong>. Please verify your details to
          set up your Parent Portal account.
        </p>
      </div>

      {/* Info banner — student on the invitation */}
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 px-4 py-3 rounded mb-6">
        <p className="text-sm">
          Linking to: <strong>{invitation?.student_first_name}</strong> ({invitation?.student_initials})
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label-field">Your Phone Number (from admission record)</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="e.g. 0729949029"
          />
          {fieldErrors.phone && <p className="text-red-600 text-xs mt-1">{fieldErrors.phone[0] || fieldErrors.phone}</p>}
        </div>

        <div>
          <label className="label-field">Your National ID</label>
          <input
            type="text"
            name="national_id"
            value={formData.national_id}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="e.g. 11663311"
          />
          {fieldErrors.national_id && <p className="text-red-600 text-xs mt-1">{fieldErrors.national_id[0] || fieldErrors.national_id}</p>}
        </div>

        <div>
          <label className="label-field">Student's Date of Birth</label>
          <input
            type="date"
            name="student_dob"
            value={formData.student_dob}
            onChange={handleChange}
            required
            className="input-field"
          />
          {fieldErrors.student_dob && <p className="text-red-600 text-xs mt-1">{fieldErrors.student_dob[0] || fieldErrors.student_dob}</p>}
        </div>

        <div className="border-t border-gray-100 pt-5 mt-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Set Your Password</p>

          <div className="space-y-4">
            <div>
              <label className="label-field">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="input-field"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              {fieldErrors.password && <p className="text-red-600 text-xs mt-1">{fieldErrors.password[0] || fieldErrors.password}</p>}
            </div>

            <div>
              <label className="label-field">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                minLength={8}
                className="input-field"
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
              {fieldErrors.confirm_password && <p className="text-red-600 text-xs mt-1">{fieldErrors.confirm_password[0] || fieldErrors.confirm_password}</p>}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 text-primary-900 focus:ring-primary-900 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">Show passwords</span>
            </label>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Creating account...
            </span>
          ) : (
            'Accept Invitation & Create Account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        Your details must match the school's admission record. If they don't, please contact the school office.
      </p>
    </>
  );
};

export default AcceptInvitation;