import React, { useContext, useEffect, useState, useMemo } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'

const Doctors = () => {
  // Utility function to format specialty names
  const formatSpecialty = (specialty) => {
    // Replace underscores with spaces for display purposes
    if (specialty === 'Internal_Medicine') {
      return 'Internal Medicine';
    }
    if (specialty === 'General_Physician') {
      return 'General Physician';
    }
    return specialty;
  };

  const { speciality } = useParams()

  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate();

  const { doctors } = useContext(AppContext)
  
  // Get unique specialties that have at least one doctor
  const availableSpecialties = useMemo(() => {
    const specialtiesSet = new Set();
    doctors.forEach(doctor => {
      if (doctor.speciality) {
        specialtiesSet.add(doctor.speciality);
      }
    });
    return Array.from(specialtiesSet).sort();
  }, [doctors]);

  const applyFilter = () => {
    if (speciality) {
      // Handle the special case for Internal_Medicine
      if (speciality === 'Internal_Medicine') {
        setFilterDoc(doctors.filter(doc => doc.speciality === 'Internal_Medicine'))
      } else {
        setFilterDoc(doctors.filter(doc => doc.speciality === speciality))
      }
    } else {
      setFilterDoc(doctors)
    }
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality])

  return (
    <div>
      <p className='text-gray-600'>Browse through the doctors specialist.</p>
      <div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
        <button onClick={() => setShowFilter(!showFilter)} className={`py-1 px-3 border rounded text-sm  transition-all sm:hidden ${showFilter ? 'bg-primary text-white' : ''}`}>Filters</button>
        <div className={`flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
          {availableSpecialties.length > 0 ? (
            availableSpecialties.map((specialty, index) => (
              <p 
                key={index}
                onClick={() => speciality === specialty ? navigate('/doctors') : navigate(`/doctors/${specialty}`)}
                className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === specialty ? 'bg-[#E2E5FF] text-black ' : ''}`}
              >
                {formatSpecialty(specialty)}
              </p>
            ))
          ) : (
            <p className='w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded text-gray-500'>No specialties available</p>
          )}
        </div>
        <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
          {filterDoc.map((item, index) => (
            <div 
              onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} 
              className='w-full max-w-[300px] mx-auto border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500 shadow-sm' 
              key={index}
            >
              <div className='w-full h-[300px] relative bg-[#EAEFFF]'>
                <img 
                  className='absolute inset-0 w-full h-full object-cover object-center' 
                  src={item.image} 
                  alt={item.name}
                  loading="lazy"
                />
              </div>
              <div className='p-5 bg-white'>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${item.available ? 'text-green-500 bg-green-50' : "text-gray-500 bg-gray-50"}`}>
                  <div className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></div>
                  <span>{item.available ? 'Available' : "Not Available"}</span>
                </div>
                <h3 className='mt-3 text-[#262626] text-lg font-medium truncate'>Dr. {item.name} {item.name_extension && <span className="text-gray-500">{item.name_extension}</span>}</h3>
                <p className='text-[#5C5C5C] text-sm mt-1'>{item.speciality}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Doctors