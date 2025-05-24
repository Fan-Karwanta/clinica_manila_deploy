import React, { useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigationBlocker } from '../context/NavigationContext'

const Appointment = () => {

    const { docId } = useParams()
    const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    const [docInfo, setDocInfo] = useState(false)
    const [docSlots, setDocSlots] = useState([])
    const [selectedDate, setSelectedDate] = useState(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [slotTime, setSlotTime] = useState('')
    const [availableDates, setAvailableDates] = useState(new Set())
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [isFormDirty, setIsFormDirty] = useState(false)
    const [pendingNavigation, setPendingNavigation] = useState(null)
    const [userBookedSlots, setUserBookedSlots] = useState({})
    const [userDoctorBookedDates, setUserDoctorBookedDates] = useState([])
    const [appointmentReason, setAppointmentReason] = useState('')

    const navigate = useNavigate()
    const location = useLocation()

    // Register navigation blocker when form is dirty
    useNavigationBlocker(() => isFormDirty && selectedDate);

    // Navigation warning system
    const handleNavigation = useCallback((path) => {
        if (isFormDirty && selectedDate) {
            // If form is dirty, show warning modal
            return false
        }
        // Otherwise, navigate directly
        navigate(path)
        return true
    }, [isFormDirty, navigate, selectedDate])

    // Confirm navigation and discard changes
    const confirmNavigation = () => {
        setIsFormDirty(false)
        if (pendingNavigation) {
            navigate(pendingNavigation)
        }
    }

    // Cancel navigation and continue with booking
    const cancelNavigation = () => {
        setPendingNavigation(null)
    }

    // Function to get calendar days
    const getCalendarDays = (date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        const startOffset = firstDay.getDay()
        const daysInMonth = lastDay.getDate()
        
        let days = []
        
        // Add empty cells for days before the first of the month
        for (let i = 0; i < startOffset; i++) {
            days.push(null)
        }
        
        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(date.getFullYear(), date.getMonth(), i))
        }
        
        return days
    }

    // Function to check if a date is already booked with this doctor
    const isAlreadyBookedWithDoctor = (date) => {
        if (!date) return false
        
        // Format the date to check if it's in the user's booked dates for this doctor
        const day = date.getDate()
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        const formattedDate = `${day}_${month}_${year}`
        
        // Check if the user has already booked this date with this doctor
        return userDoctorBookedDates.includes(formattedDate)
    }
    
    // Function to check if a date is selectable (at least 5 days from now and up to 1 month)
    const isDateSelectable = (date) => {
        if (!date || !docInfo) return false
        
        // Get today's date and reset time to start of day for accurate comparison
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Get the date to check and reset time
        const dateToCheck = new Date(date)
        dateToCheck.setHours(0, 0, 0, 0)
        
        // Calculate the difference in days
        const diffTime = dateToCheck.getTime() - today.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        // Calculate maximum date (1 month from today)
        const maxDate = new Date(today)
        maxDate.setMonth(today.getMonth() + 1)
        maxDate.setHours(23, 59, 59, 999)
        
        // Check if the date falls on the doctor's day off
        const dayOfWeek = daysOfWeek[dateToCheck.getDay()]
        const fullDayName = getDayFullName(dayOfWeek)
        const isDayOff = docInfo.dayOff && fullDayName === docInfo.dayOff
        
        // Date is selectable if it's at least 5 days in the future, within 1 month,
        // not already booked with this doctor, and not the doctor's day off
        return diffDays >= 5 && dateToCheck <= maxDate && !isAlreadyBookedWithDoctor(date) && !isDayOff
    }
    
    // Helper function to convert short day name to full day name
    const getDayFullName = (shortDay) => {
        switch(shortDay) {
            case 'Mon': return 'Monday';
            case 'Tue': return 'Tuesday';
            case 'Wed': return 'Wednesday';
            case 'Thu': return 'Thursday';
            case 'Fri': return 'Friday';
            case 'Sat': return 'Saturday';
            case 'Sun': return 'Sunday';
            default: return '';
        }
    }

    // Fetch user's booked slots for the current month
    const fetchUserBookedSlots = async () => {
        if (!token) return;
        
        try {
            // Get the first and last day of the current month
            const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            
            // Format dates for API query
            const formatDateForQuery = (date) => {
                const day = date.getDate();
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                return `${day}_${month}_${year}`;
            };
            
            const startDate = formatDateForQuery(firstDay);
            const endDate = formatDateForQuery(lastDay);
            
            const { data } = await axios.get(
                `${backendUrl}/api/user/booked-slots?startDate=${startDate}&endDate=${endDate}`, 
                { headers: { token } }
            );
            
            if (data.success) {
                setUserBookedSlots(data.bookedSlots);
            }
        } catch (error) {
            console.error('Error fetching user booked slots:', error);
        }
    };
    
    // Fetch user's booked dates with this specific doctor
    const fetchUserDoctorBookedDates = async () => {
        if (!token || !docId) return;
        
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/user/doctor-booked-dates?docId=${docId}`,
                { headers: { token } }
            );
            
            if (data.success) {
                setUserDoctorBookedDates(data.bookedDates);
            }
        } catch (error) {
            console.error('Error fetching user-doctor booked dates:', error);
        }
    };

    const handleDateClick = (date) => {
        if (!date || !isDateSelectable(date)) return
        setSelectedDate(date)
        setIsFormDirty(true) // Mark form as dirty when date is selected
        
        // Get time slots for the selected date
        const timeSlots = []
        const currentDate = new Date(date)
        currentDate.setHours(10, 0, 0, 0)
        const endTime = new Date(date)
        endTime.setHours(21, 0, 0, 0)

        // Format the selected date as slotDate string (day_month_year)
        const day = date.getDate()
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        const slotDate = `${day}_${month}_${year}`
        
        // Get user's booked slots for this date
        const userBookedTimesForDate = userBookedSlots[slotDate] || []

        while (currentDate < endTime) {
            const formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            
            // Check if slot is available (not booked by the doctor and not already booked by the user)
            const isSlotBookedByDoctor = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(formattedTime)
            const isSlotBookedByUser = userBookedTimesForDate.includes(formattedTime)
            
            const isSlotAvailable = !isSlotBookedByDoctor && !isSlotBookedByUser
            
            timeSlots.push({
                datetime: new Date(currentDate),
                time: formattedTime,
                available: isSlotAvailable,
                bookedByUser: isSlotBookedByUser
            })
            
            currentDate.setMinutes(currentDate.getMinutes() + 30)
        }
        
        setDocSlots([timeSlots])
        setSlotTime('')
    }

    const changeMonth = (offset) => {
        const newDate = new Date(currentMonth)
        newDate.setMonth(newDate.getMonth() + offset)
        setCurrentMonth(newDate)
    }

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId)
        setDocInfo(docInfo)
    }

    const bookAppointment = async () => {

        if (!token) {
            toast.warning('Login to book appointment')
            return navigate('/login')
        }

        if (!appointmentReason.trim()) {
            toast.warning('Please provide a reason for your appointment')
            return
        }

        const date = selectedDate

        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()

        const slotDate = `${day}_${month}_${year}`

        try {

            const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime, appointmentReason }, { headers: { token } })
            if (data.success) {
                toast.success(data.message)
                setIsFormDirty(false) // Reset form dirty state after successful booking
                navigate('/my-appointments')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    useEffect(() => {
        if (doctors.length > 0) {
            fetchDocInfo()
        }
    }, [doctors, docId])

    // Fetch user's booked slots and doctor-specific booked dates when the month changes or doctor changes
    useEffect(() => {
        fetchUserBookedSlots();
        fetchUserDoctorBookedDates();
    }, [currentMonth, token, docId]);

    // If selected date changes and we already have user booked slots, update the time slots
    useEffect(() => {
        if (selectedDate && Object.keys(userBookedSlots).length > 0) {
            handleDateClick(selectedDate);
        }
    }, [userBookedSlots]);

    // Effect to intercept navigation attempts
    useEffect(() => {
        // Function to handle beforeunload event (browser refresh/close)
        const handleBeforeUnload = (e) => {
            if (isFormDirty && selectedDate) {
                // Standard way to show a browser confirmation dialog
                e.preventDefault()
                e.returnValue = '' // Chrome requires returnValue to be set
                return '' // This message is not displayed in modern browsers
            }
        }

        // Add event listener for browser refresh/close
        window.addEventListener('beforeunload', handleBeforeUnload)

        // Cleanup function
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isFormDirty, selectedDate])

    return docInfo ? (
        <div>
            {/* ---------- Doctor Details ----------- */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <div>
                    <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
                </div>

                <div className='flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>

                    {/* ----- Doc Info : name, degree, experience ----- */}

                    <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>Dr. {docInfo.name} {docInfo.name_extension && <span className="text-gray-500">{docInfo.name_extension}</span>} <img className='w-5' src={assets.verified_icon} alt="" /></p>
                    <div className='flex items-center gap-2 mt-1 text-gray-600'>
                        <p>{docInfo.degree} - {docInfo.speciality}</p>
                        <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
                    </div>

                    {/* ----- Doc About ----- */}
                    <div>
                        <p className='flex items-center gap-1 text-sm font-medium text-[#262626] mt-3'>About <img className='w-3' src={assets.info_icon} alt="" /></p>
                        <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{docInfo.about}</p>
                    </div>
                    {/*
                    <p className='text-gray-600 font-medium mt-4'>Appointment fee: <span className='text-gray-800'>{currencySymbol}{docInfo.fees}</span> </p>
                        */}
                    </div>
            </div>

            {/* Calendar View */}
            <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]'>
                <p>Select Appointment Date</p>
                
                {/* Month Navigation */}
                <div className="flex justify-between items-center mt-4 mb-2">
                    <button 
                        onClick={() => changeMonth(-1)}
                        className="px-4 py-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                    >
                        Previous
                    </button>
                    <h2 className="text-xl font-semibold">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h2>
                    <button 
                        onClick={() => changeMonth(1)}
                        className="px-4 py-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                    >
                        Next
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="border rounded-lg overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 bg-gray-50">
                        {daysOfWeek.map(day => (
                            <div key={day} className="py-2 text-center text-sm font-medium">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7">
                        {getCalendarDays(currentMonth).map((date, index) => {
                            // Check if this date is the doctor's day off
                            let isDayOff = false;
                            if (date && docInfo && docInfo.dayOff) {
                                const dayOfWeek = daysOfWeek[date.getDay()];
                                const fullDayName = getDayFullName(dayOfWeek);
                                isDayOff = fullDayName === docInfo.dayOff;
                            }
                            
                            return (
                                <div
                                    key={index}
                                    onClick={() => handleDateClick(date)}
                                    className={`
                                        p-2 border-t border-l first:border-l-0 text-center min-h-[80px]
                                        ${!date ? 'bg-gray-50' : ''}
                                        ${date && isDateSelectable(date) ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'}
                                        ${date && selectedDate && date.toDateString() === selectedDate.toDateString() ? 'bg-primary text-white' : ''}
                                        ${date && !isDateSelectable(date) ? 'text-gray-400' : ''}
                                        ${isDayOff ? 'bg-red-50' : ''}
                                    `}
                                >
                                    {date ? (
                                        <div className="flex flex-col items-center">
                                            <span className={`text-lg ${date && isDateSelectable(date) ? 'font-semibold' : ''}`}>
                                                {date.getDate()}
                                            </span>
                                            {isDayOff && (
                                                <span className="text-xs text-red-500 mt-1">Doctor's Day Off</span>
                                            )}
                                            {date && !isDateSelectable(date) && isAlreadyBookedWithDoctor(date) && (
                                                <span className="text-xs text-red-500 mt-1">Already booked</span>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                    <div className="mt-6">
                        <p className="mb-3">Select Time Slot for {selectedDate.toLocaleDateString()}</p>
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full'>
                            {docSlots[0]?.map((item, index) => (
                                <p 
                                    onClick={() => {
                                        if (item.available) {
                                            setSlotTime(item.time)
                                            setIsFormDirty(true) // Mark form as dirty when time is selected
                                        }
                                    }}
                                    key={index} 
                                    className={`
                                        text-sm font-light flex-shrink-0 px-5 py-2 rounded-full 
                                        ${!item.available 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : item.time === slotTime 
                                                ? 'bg-primary text-white cursor-pointer' 
                                                : 'text-[#949494] border border-[#B4B4B4] cursor-pointer hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    {item.time.toLowerCase()}
                                    {item.bookedByUser && (
                                        <span className="block text-xs">Already booked</span>
                                    )}
                                </p>
                            ))}
                        </div>
                    </div>
                )}
<br />
                {selectedDate && slotTime && (
                    <div className="flex flex-col items-center">
                        {/* Appointment Reason Comment Box */}
                        <div className="w-full max-w-xl mb-4">
                            <label htmlFor="appointment-reason" className="block text-sm font-medium text-gray-700 mb-1">
                                Appointment Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="appointment-reason"
                                value={appointmentReason}
                                onChange={(e) => {
                                    setAppointmentReason(e.target.value)
                                    setIsFormDirty(true) // Mark form as dirty when reason is entered
                                }}
                                placeholder="Please describe the reason for your appointment..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                rows={3}
                                required
                            />
                        </div>
                        
                        <div className="flex items-start mb-4 w-full max-w-xl bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                            <input 
                                type="checkbox" 
                                id="terms-checkbox" 
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-1 mr-3 h-5 w-5 accent-primary cursor-pointer"
                            />
                            <label htmlFor="terms-checkbox" className="text-sm text-gray-700 leading-relaxed">
                                <span className="font-medium text-primary">Important:</span> By checking this box, I confirm that I will arrive <span className="font-medium">15 minutes BEFORE</span> the scheduled appointment time. I understand that once an appointment is 'approved' by the doctor, it cannot be cancelled. I also acknowledge that spam booking will result in my account being <span className="font-medium">PERMANENTLY BANNED</span>.
                            </label>
                        </div>
                        <button 
                            onClick={bookAppointment} 
                            disabled={!slotTime || !termsAccepted}
                            className={`
                                py-3 px-8 rounded-full 
                                ${(!slotTime || !termsAccepted) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white'}
                            `}
                        >
                            Book Appointment
                        </button>
                    </div>
                )}
            </div>

            {/* Listing Releated Doctors */}
            <div className='mt-12'>
                <RelatedDoctors 
                    speciality={docInfo.speciality} 
                    excludeDocId={docId} 
                    onDoctorClick={(id) => {
                        // Use our custom navigation handler
                        handleNavigation(`/appointment/${id}`)
                    }}
                />
            </div>
        </div>
    ) : null
}

export default Appointment