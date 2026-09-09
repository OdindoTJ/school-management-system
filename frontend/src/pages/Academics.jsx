import React from 'react';

const Academics = () => {
  const programs = [
    {
      level: 'Junior Secondary (Forms 1-2)',
      subjects: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'Religious Education', 'Creative Arts'],
      description: 'Foundation program building essential skills and knowledge across all core subjects.'
    },
    {
      level: 'Senior Secondary (Forms 3-4)',
      subjects: ['Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Business Studies'],
      description: 'Comprehensive preparation for national examinations and future career paths.'
    },
    {
      level: 'Advanced Level (Forms 5-6)',
      subjects: ['Pure Mathematics', 'Applied Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Economics'],
      description: 'Specialized program preparing students for university and professional careers.'
    }
  ];

  return (
    <div>
      <section className="bg-gray-50 py-16">
        <div className="container-custom">
          <h1 className="text-4xl font-bold text-center mb-4">Academics</h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Explore our comprehensive academic programs designed to nurture excellence and foster lifelong learning.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 gap-8">
            {programs.map((program, index) => (
              <div key={index} className="card p-8">
                <h2 className="text-2xl font-bold text-primary-600 mb-2">{program.level}</h2>
                <p className="text-gray-600 mb-4">{program.description}</p>
                <div>
                  <h3 className="font-semibold mb-2">Core Subjects:</h3>
                  <div className="flex flex-wrap gap-2">
                    {program.subjects.map((subject, idx) => (
                      <span key={idx} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-16">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Enroll?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our academic community and give your child the best education possible.
          </p>
          <a href="/contact" className="btn-primary inline-block">
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
};

export default Academics;