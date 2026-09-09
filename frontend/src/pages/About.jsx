import React from 'react';

const About = () => {
  return (
    <div>
      <section className="bg-gray-50 py-16">
        <div className="container-custom">
          <h1 className="text-4xl font-bold text-center mb-4">About Us</h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Learn about our school's mission, vision, and commitment to excellence in education.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                To provide quality education that nurtures intellectual curiosity, 
                promotes character development, and prepares students for lifelong 
                success in a rapidly changing world.
              </p>
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-2">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  To be a center of excellence in education, producing responsible, 
                  innovative, and compassionate leaders who positively impact their communities.
                </p>
              </div>
            </div>
            <div className="bg-primary-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Core Values</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <span className="text-2xl">⭐</span>
                  <span><strong>Excellence:</strong> Striving for the highest standards in everything we do</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-2xl">🤝</span>
                  <span><strong>Integrity:</strong> Acting with honesty, transparency, and ethical conduct</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-2xl">💡</span>
                  <span><strong>Innovation:</strong> Embracing creativity and continuous improvement</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-2xl">🌍</span>
                  <span><strong>Community:</strong> Fostering a supportive and inclusive learning environment</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-2xl">🏆</span>
                  <span><strong>Respect:</strong> Valuing diversity and treating everyone with dignity</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our School</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-2">Quality Curriculum</h3>
              <p className="text-gray-600">Comprehensive and balanced education that develops the whole child</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-bold mb-2">Qualified Teachers</h3>
              <p className="text-gray-600">Experienced educators passionate about student success</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🏫</div>
              <h3 className="text-xl font-bold mb-2">Safe Environment</h3>
              <p className="text-gray-600">Secure and supportive atmosphere for optimal learning</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;