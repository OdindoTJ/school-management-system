import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { studentsAPI } from '../../api/students';
import ResetPasswordModal from '../../components/students/ResetPasswordModal';
import DeactivateModal from '../../components/students/DeactivateModal';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await studentsAPI.get(id);
      setStudent(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load student.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReactivate = async () => {
    try {
      await studentsAPI.reactivate(id);
      await fetchStudent();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reactivate.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
        {error || 'Student not found.'}
      </div>
    );
  }

  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/students" className="hover:text-primary-900">Students</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{student.full_name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {student.photo_url ? (
            <img
              src={student.photo_url}
              alt={student.full_name}
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary-900 text-white flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.full_name}</h1>
            <p className="text-sm text-gray-500">
              {student.admission_number} · {student.class_name || 'No class assigned'}
            </p>
            <div className="mt-1">
              {student.is_active ? (
                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Active</span>
              ) : (
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">Inactive</span>
              )}
              {student.must_change_password && (
                <span className="ml-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                  Must change password
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/students/${student.id}/edit`}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>

          <button
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Reset Password
          </button>

          {student.is_active ? (
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
            >
              Reactivate
            </button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Personal Information</h2>
          <dl className="space-y-3">
            <Row label="First Name" value={student.first_name} />
            <Row label="Last Name" value={student.last_name} />
            <Row label="Date of Birth" value={student.date_of_birth} />
            <Row label="Gender" value={capitalize(student.gender)} />
            <Row label="Address" value={student.address || '—'} />
          </dl>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Academic Information</h2>
          <dl className="space-y-3">
            <Row label="Admission Number" value={student.admission_number} />
            <Row label="Class" value={student.class_name || 'Not assigned'} />
            <Row label="Enrollment Date" value={student.enrollment_date} />
            <Row label="Username" value={student.username} />
          </dl>
        </div>
      </div>

      {/* Modals */}
      <ResetPasswordModal
        isOpen={showResetModal}
        student={student}
        onClose={() => setShowResetModal(false)}
      />
      <DeactivateModal
        isOpen={showDeactivateModal}
        student={student}
        onClose={() => setShowDeactivateModal(false)}
        onSuccess={() => {
          setShowDeactivateModal(false);
          fetchStudent();
        }}
      />
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

export default Detail;