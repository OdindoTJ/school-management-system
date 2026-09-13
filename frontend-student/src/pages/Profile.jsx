import React, { useState, useEffect } from 'react';
import { studentAPI } from '../api/student';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentAPI.getProfile();
        setProfile(res.data);
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const initials = profile
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Your personal information</p>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {profile?.photo ? (
            <img
              src={profile.photo.startsWith('http') ? profile.photo : `http://localhost:8000${profile.photo}`}
              alt={profile.full_name}
              className="w-28 h-28 rounded-2xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-28 h-28 rounded-2xl bg-primary-900 text-white flex items-center justify-center text-4xl font-bold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name}</h2>
            <p className="text-primary-900 font-medium">{profile?.class_name || 'No class assigned'}</p>
            <p className="text-sm text-gray-500 mt-1">Admission: {profile?.admission_number}</p>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Personal Information</h3>
          <dl className="space-y-3">
            <Row label="First Name" value={profile?.first_name} />
            <Row label="Last Name" value={profile?.last_name} />
            <Row label="Date of Birth" value={profile?.date_of_birth} />
            <Row label="Gender" value={capitalize(profile?.gender)} />
            <Row label="Address" value={profile?.address || '—'} />
          </dl>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Academic Information</h3>
          <dl className="space-y-3">
            <Row label="Admission Number" value={profile?.admission_number} />
            <Row label="Class" value={profile?.class_name || '—'} />
            <Row label="Class Teacher" value={profile?.class_teacher || '—'} />
            <Row label="Enrollment Date" value={profile?.enrollment_date} />
            <Row label="Username" value={profile?.username} />
          </dl>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          To update your profile, please contact the school administrator.
        </p>
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className="text-sm font-medium text-gray-900 text-right">{value || '—'}</dd>
  </div>
);

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export default Profile;