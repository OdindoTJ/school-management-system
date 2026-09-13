import React, { useState, useEffect } from 'react';
import { parentAPI } from '../api/parent';
import { useChild } from '../context/ChildContext';

const ReportCard = () => {
  const { selectedChild } = useChild();
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await parentAPI.getTerms();
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setTerms(data);
        const current = data.find((t) => t.is_current);
        if (current) setSelectedTerm(current.id);
        else if (data.length > 0) setSelectedTerm(data[0].id);
      } catch (err) {
        console.error('Terms fetch error:', err);
      }
    };
    fetchTerms();
  }, []);

  useEffect(() => {
    if (!selectedChild || !selectedTerm) return;
    const fetchReportCard = async () => {
      setLoading(true);
      try {
        const res = await parentAPI.getChildReportCard(selectedChild.id, selectedTerm);
        setReportCard(res.data);
      } catch (err) {
        console.error('Report card fetch error:', err);
        setReportCard(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReportCard();
  }, [selectedChild, selectedTerm]);

  const handlePrint = () => window.print();

  if (!selectedChild) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
        <p className="text-gray-500">Please select a child above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Card</h1>
          <p className="text-gray-500 text-sm mt-1">
            {selectedChild.full_name}'s term report
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="input-field"
          >
            <option value="">Select Term</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.year} {t.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            disabled={!reportCard}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Download / Print
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !reportCard ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">No report card available for this term.</p>
        </div>
      ) : (
        <div className="report-card bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b-2 border-primary-900 mb-6">
            <img src="/logo.png" alt="Arina School" className="h-20 w-20 object-contain" />
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-bold text-primary-900">ARINA SCHOOL</h2>
              <p className="text-sm text-gray-500 tracking-widest uppercase">Learn • Grow • Excel</p>
              <p className="text-xs text-gray-400 mt-1">Official Student Report Card</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="space-y-1">
              <InfoLine label="Student Name" value={reportCard.student.full_name} />
              <InfoLine label="Admission Number" value={reportCard.student.admission_number} />
              <InfoLine label="Class" value={reportCard.student.class_name} />
            </div>
            <div className="space-y-1 sm:text-right">
              <InfoLine label="Term" value={`${reportCard.term.name} ${reportCard.term.year}`} />
              <InfoLine label="Start Date" value={reportCard.term.start_date} />
              <InfoLine label="End Date" value={reportCard.term.end_date} />
            </div>
          </div>

          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-900 text-white">
                  <th className="text-left py-3 px-4 font-semibold">Subject</th>
                  <th className="text-left py-3 px-4 font-semibold">Exams</th>
                  <th className="text-right py-3 px-4 font-semibold">Average</th>
                  <th className="text-right py-3 px-4 font-semibold">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportCard.subjects.map((subj, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{subj.subject}</p>
                      <p className="text-xs text-gray-500">{subj.subject_code}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {subj.exams.map((exam, i) => (
                          <p key={i} className="text-xs text-gray-600">
                            {exam.exam_type}: <strong>{exam.score}/{exam.max_score}</strong> ({exam.grade_letter})
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-primary-900">
                      {subj.average_percentage}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary-50 text-primary-900 font-semibold">
                        {letterFromPct(subj.average_percentage)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-primary-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 uppercase tracking-wider font-semibold">Overall Average</p>
                <p className="text-4xl font-bold text-primary-900 mt-1">{reportCard.overall_average}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 uppercase tracking-wider font-semibold">Overall Grade</p>
                <p className="text-4xl font-bold text-primary-900 mt-1">
                  {letterFromPct(reportCard.overall_average)}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <div className="border-t border-gray-300 pt-2 mt-8">
                  <p className="text-gray-500 text-xs">Class Teacher's Signature</p>
                </div>
              </div>
              <div>
                <div className="border-t border-gray-300 pt-2 mt-8">
                  <p className="text-gray-500 text-xs">Principal's Signature</p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">
              This is an official report card issued by Arina School. Any alterations render it invalid.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoLine = ({ label, value }) => (
  <div className="flex items-baseline gap-2 text-sm">
    <span className="text-gray-500">{label}:</span>
    <span className="font-semibold text-gray-900">{value || '—'}</span>
  </div>
);

const letterFromPct = (pct) => {
  const p = Number(pct);
  if (p >= 80) return 'A';
  if (p >= 75) return 'B+';
  if (p >= 70) return 'B';
  if (p >= 65) return 'B-';
  if (p >= 60) return 'C+';
  if (p >= 55) return 'C';
  if (p >= 50) return 'C-';
  if (p >= 45) return 'D+';
  if (p >= 40) return 'D';
  return 'E';
};

export default ReportCard;