import React, { useContext, useMemo } from 'react'
import { specialityData } from '../assets/assets'
import { Link } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const SpecialityMenu = () => {
    const { doctors } = useContext(AppContext)
    
    // Get unique specialties that have at least one doctor
    const availableSpecialties = useMemo(() => {
        const specialtiesSet = new Set()
        doctors.forEach(doctor => {
            if (doctor.speciality) {
                specialtiesSet.add(doctor.speciality)
            }
        })
        return Array.from(specialtiesSet)
    }, [doctors])
    
    // Filter specialityData to only include specialties that have doctors
    const filteredSpecialityData = useMemo(() => {
        return specialityData.filter(item => {
            // Handle the special case for Internal Medicine
            if (item.speciality === 'Internal Medicine' && availableSpecialties.includes('Internal_Medicine')) {
                return true
            }
            // Handle the special case for Obgynecology
            if (item.speciality === 'Obgynecology' && availableSpecialties.includes('Obgynecologist')) {
                return true
            }
            // Handle the special case for Ophthalmology
            if (item.speciality === 'Ophthalmology' && availableSpecialties.includes('Ophthalmologist')) {
                return true
            }
            return availableSpecialties.includes(item.speciality)
        })
    }, [availableSpecialties])
    return (
        <div id='speciality' className='flex flex-col items-center gap-4 py-16 text-[#262626]'>
            <h1 className='text-3xl font-medium'>Find by Speciality</h1>
            <p className='sm:w-1/3 text-center text-sm'>Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free.</p>
            <div className='flex sm:justify-center gap-8 pt-8 w-full overflow-x-auto px-4 pb-4'>
                {filteredSpecialityData.map((item, index) => (
                    <Link 
                        to={`/doctors/${item.speciality === 'Internal Medicine' ? 'Internal_Medicine' : 
                              item.speciality === 'Obgynecology' ? 'Obgynecologist' : 
                              item.speciality === 'Ophthalmology' ? 'Ophthalmologist' : 
                              item.speciality}`} 
                        onClick={() => scrollTo(0, 0)} 
                        className='flex flex-col items-center text-sm cursor-pointer flex-shrink-0 hover:-translate-y-2 transition-all duration-300' 
                        key={index}
                    >
                        <div className='w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center p-3 rounded-full bg-blue-50 mb-3'>
                            <img 
                                className='w-full h-full object-contain' 
                                src={item.image} 
                                alt={item.speciality} 
                            />
                        </div>
                        <p className='font-medium'>{item.speciality}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default SpecialityMenu