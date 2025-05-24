import React from 'react'
import { assets } from '../assets/assets'
import { Link, useNavigate } from 'react-router-dom'

const Footer = () => {
  const navigate = useNavigate()
  return (
    <div className='md:mx-10'>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10  mt-40 text-sm'>

        <div>
          <img className='mb-5 w-40' src={assets.logo} alt="" />
          <p className='w-full md:w-2/3 text-gray-600 leading-6'>Clinica Manila is a reliable and efficient hospital appointment system designed to streamline the scheduling process, reduce waiting times, and enhance patient care. By providing a seamless and user-friendly experience, it ensures that residents can easily book their medical appointments.</p>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>Clinica Manila</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>
              <Link to="/" className="hover:text-primary cursor-pointer transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary cursor-pointer transition-colors">
                About us
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-primary cursor-pointer transition-colors">
                Terms & Conditions
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>
              <a href="tel:+632 8661 7777" className="hover:text-primary cursor-pointer transition-colors">
              +632 8661 7777
              </a>
            </li>
            <li>
              <a href="mailto:clinica_manila.supp@gmail.com" className="hover:text-primary cursor-pointer transition-colors">
                clinica.manila.supp@gmail.com
              </a>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary cursor-pointer transition-colors">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/feedback" className="hover:text-primary cursor-pointer transition-colors">
                Send Feedback
              </Link>
            </li>
          </ul>
        </div>

      </div>

      <div>
        <hr />
        <p className='py-5 text-sm text-center'>Copyright 2025 @ Clinica Manila - All Right Reserved.</p>
      </div>

    </div>
  )
}

export default Footer
