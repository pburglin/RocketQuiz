import React from 'react';
import { Footer } from '../components';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-6">About RocketQuiz</h1>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              RocketQuiz is dedicated to making learning fun and engaging through interactive quizzes. 
              We believe that knowledge should be accessible to everyone, and that the best way to learn 
              is through active participation and friendly competition.
            </p>
            <p className="text-gray-700 mb-4">
              Whether you're a student looking to test your knowledge, a teacher creating educational content, 
              or just someone who enjoys trivia, RocketQuiz provides a platform for creating, sharing, and 
              participating in quizzes on any topic imaginable.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Create custom quizzes with multiple-choice questions</li>
              <li>Add images to make your quizzes more engaging</li>
              <li>Play in single-player mode to test your knowledge</li>
              <li>Compete with friends in real-time multiplayer sessions</li>
              <li>Track your scores and see how you rank on leaderboards</li>
              <li>Browse and search for quizzes created by the community</li>
              <li>Share quizzes with friends through unique links</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
            <p className="text-gray-700 mb-4">
              RocketQuiz was created by a passionate team of developers who love learning and believe 
              in the power of interactive education. We're constantly working to improve the platform 
              and add new features based on user feedback.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              Have questions, suggestions, or feedback? We'd love to hear from you! 
              Reach out to us at the project Git repository, just create an issue with your message.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}