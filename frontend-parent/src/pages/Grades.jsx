import React, { useState, useEffect } from 'react';
import { parentAPI } from '../api/parent';
import { useChild } from '../context/ChildContext';

const Grades = () => {
  const { selectedChild } = useChild();
  const [grades, setGrades] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await parentAPI.getTerms();
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setTerms(data);
      } catch (err) {
        console.error('Terms fetch error:', err);
      }
    };
    fetchTerms();
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    const fetchGrades = async () => {
      setLoading(true);
      try {
        const params = selectedTerm ? { term: selectedTerm } : {};
        const res = await parentAPI.getChildGrades(selectedChild.id, params);
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setGrades(data);
      } catch (err) {
        console.error('Grades fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [selectedChild, selectedTerm]);

  if (!selectedChild) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
        <p className="text-gray-500">Please select a child above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedChild.full_name}'s Grades
          </h1>
          <p className="text-gray-500 text-sm mt-1">All exam results</p>
        </div>

        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
          className="input-field sm:w-64"
        >
          <option value="">All Terms</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.year}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : grades.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">No grades recorded{selectedTerm ? ' for this term' : ''}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Subject</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Term</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 hidden sm:table-cell">Exam</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Score</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grades.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{g.subject_name}</p>
                    <p className="text-xs text-gray-500">{g.subject_code}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 hidden md:table-cell">{g.term_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 hidden sm:table-cell">{g.exam_type_display}</td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold text-gray-900">{g.score}/{g.max_score}</p>
                    <p className="text-xs text-gray-500">{g.percentage}%</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary-50 text-primary-900 font-semibold text-sm">
                      {g.grade_letter}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Grades;