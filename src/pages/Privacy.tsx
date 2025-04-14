import React from 'react';
import { Footer } from '../components';

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <section className="mb-8">
            <p className="text-gray-700 mb-4">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-gray-700 mb-4">
              At RocketQuiz, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our service.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect information that you provide directly to us when you:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Create an account</li>
              <li>Create or participate in quizzes</li>
              <li>Communicate with us</li>
              <li>Participate in multiplayer sessions</li>
            </ul>
            <p className="text-gray-700 mb-4">
              This information may include your name, email address, username, and quiz activity.
            </p>
            <p className="text-gray-700 mb-4">
              We also automatically collect certain information about your device and how you interact with our service, 
              including IP address, browser type, pages visited, and time spent on the service.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide, maintain, and improve our service</li>
              <li>Process and complete transactions</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Protect against, identify, and prevent fraud and other illegal activity</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Sharing Your Information</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or otherwise transfer your personal information to outside parties except 
              in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and property</li>
              <li>In connection with a business transfer (e.g., merger or acquisition)</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect the security of your personal information. 
              However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee 
              absolute security.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Choices</h2>
            <p className="text-gray-700 mb-4">
              You can access, update, or delete your account information at any time by logging into your account settings. 
              You may also contact us directly to request access to, correction of, or deletion of any personal information 
              we have about you.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us by creating a new issue at{" "}
              <a
                href="https://github.com/pburglin/RocketQuiz/issues"
                className="text-blue-600 underline hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://github.com/pburglin/RocketQuiz/issues
              </a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}