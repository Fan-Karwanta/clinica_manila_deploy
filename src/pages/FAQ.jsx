import React, { useState } from 'react';

const FAQ = () => {
  // State to track which questions are expanded
  const [expandedItems, setExpandedItems] = useState({});

  // Toggle function for expanding/collapsing questions
  const toggleItem = (sectionId, itemId) => {
    setExpandedItems(prev => {
      const key = `${sectionId}-${itemId}`;
      return {
        ...prev,
        [key]: !prev[key]
      };
    });
  };

  // Check if an item is expanded
  const isExpanded = (sectionId, itemId) => {
    const key = `${sectionId}-${itemId}`;
    return expandedItems[key] || false;
  };

  // FAQ Item component
  const FaqItem = ({ sectionId, id, question, answer }) => {
    const expanded = isExpanded(sectionId, id);
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out">
        <button 
          onClick={() => toggleItem(sectionId, id)}
          className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none"
        >
          <h3 className="font-semibold text-lg text-primary">{id}. {question}</h3>
          <svg 
            className={`w-5 h-5 text-primary transition-transform duration-300 ${expanded ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <p className="p-6 pt-0 text-gray-600">{answer}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <h1 className="text-3xl font-bold text-primary mb-8 text-center">Frequently Asked Questions</h1>
      
      <div className="max-w-4xl mx-auto">
        {/* General Questions Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-5 text-gray-800">General Questions</h2>
          <div className="space-y-4">
            <FaqItem 
              sectionId="general" 
              id={1} 
              question="Is the system available 24/7?" 
              answer="Yes, the online appointment system is accessible 24/7. However, appointment confirmations depend on clinic hours and doctor availability."
            />
            <FaqItem 
              sectionId="general" 
              id={2} 
              question="How do I create an account?" 
              answer="Click on the 'Sign Up' button on the homepage and follow the registration steps, including the upload of your valid ID."
            />
            <FaqItem 
              sectionId="general" 
              id={3} 
              question="I forgot my password. What should I do?" 
              answer="Click on 'Forgot Password' on the login page and follow the instructions to reset your password via email."
            />
            <FaqItem 
              sectionId="general" 
              id={4} 
              question="Is my personal information protected?" 
              answer="Yes. We comply with data privacy regulations and use industry-standard security protocols to protect your data."
            />
            <FaqItem 
              sectionId="general" 
              id={5} 
              question="What devices can I use to access the website?" 
              answer="The website works on desktops, laptops, tablets, and smartphones using any modern web browser."
            />
            <FaqItem 
              sectionId="general" 
              id={6} 
              question="How can I contact Clinica Manila for further assistance?" 
              answer="You can reach out via our 'Contact' page, call the clinic directly, or email us at clinica_manila@gmail.com."
            />
          </div>
        </div>
        
        {/* Appointment-Related Questions Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-5 text-gray-800">Appointment-Related Questions</h2>
          <div className="space-y-4">
            <FaqItem 
              sectionId="appointment" 
              id={7} 
              question="How do I book an appointment?" 
              answer="Log in to your account, go to the 'Appointments' section, select your doctor, choose a date and time, enter reason for visit, and confirm your appointment."
            />
            <FaqItem 
              sectionId="appointment" 
              id={8} 
              question="I encountered an error while scheduling an appointment. What should I do?" 
              answer="Try refreshing the page. If the problem persists, contact our support team through email clinica_manila@gmail.com."
            />
            <FaqItem 
              sectionId="appointment" 
              id={9} 
              question="Can I choose a specific doctor for my appointment?" 
              answer="Yes. During the appointment process, you can search and select your preferred doctor based on specialization and availability."
            />
            <FaqItem 
              sectionId="appointment" 
              id={10} 
              question="Can I view all my upcoming and past appointments?" 
              answer="Yes. You can see your appointment history and upcoming bookings in the 'My Appointments' section of your account."
            />
            <FaqItem 
              sectionId="appointment" 
              id={11} 
              question="Can I cancel my appointment?" 
              answer="Yes. Simply go to 'My Appointments,' select the appointment, and choose 'Cancel'."
            />
            <FaqItem 
              sectionId="appointment" 
              id={12} 
              question="Will I receive a confirmation after appointment?" 
              answer="Yes. A confirmation email will be sent to your registered email address once your appointment is successful."
            />
            <FaqItem 
              sectionId="appointment" 
              id={13} 
              question="How will I know if my appointment is approved or cancelled?" 
              answer="All appointment status updates, including approvals or cancellations, will be sent via email notifications."
            />
            <FaqItem 
              sectionId="appointment" 
              id={14} 
              question="What should I do if I did not receive an email confirmation?" 
              answer="Please check your spam or junk folder first. If the email is not there, log in to the system to verify your appointment status, or contact support for assistance."
            />
            <FaqItem 
              sectionId="appointment" 
              id={15} 
              question="Can I book multiple appointments at once?" 
              answer="For now, appointments must be booked once per day to ensure accuracy and avoid scheduling conflicts."
            />
            <FaqItem 
              sectionId="appointment" 
              id={16} 
              question="How far in advance can I book an appointment?" 
              answer="Appointments can be scheduled up to 25 days in advance, depending on the doctor's availability."
            />
            <FaqItem 
              sectionId="appointment" 
              id={17} 
              question="Can I book same-day appointments?" 
              answer="No, appointments can be scheduled five days prior to the day you are scheduling your appointment."
            />
            <FaqItem 
              sectionId="appointment" 
              id={18} 
              question="What happens if I miss my appointment?" 
              answer="Missed appointments without prior cancellation will be open for walk-ins to use your schedule. Please cancel or reschedule in advance if you cannot attend."
            />
          </div>
        </div>
        
        {/* Medical History-Related Questions Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-5 text-gray-800">Medical History-Related Questions</h2>
          <div className="space-y-4">
            <FaqItem 
              sectionId="medical" 
              id={19} 
              question="Can I view my medical history through the system?" 
              answer="Yes. Patients have access to their consultation history, and prescribed medications."
            />
            <FaqItem 
              sectionId="medical" 
              id={20} 
              question="Are my medical history records secure?" 
              answer="Absolutely. The website follows strict data privacy guidelines to ensure your medical history are safe and confidential."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
