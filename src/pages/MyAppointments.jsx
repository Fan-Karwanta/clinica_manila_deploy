import React, { useContext, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import AppointmentReasonModal from '../components/AppointmentReasonModal'

const MyAppointments = () => {

    const { backendUrl, token, addNotification, loadUserProfileData } = useContext(AppContext)
    const navigate = useNavigate()
    
    // Add loading state to prevent premature API calls
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(!!token)
    const eventSourceRef = useRef(null)

    const [appointments, setAppointments] = useState([])
    const [previousAppointments, setPreviousAppointments] = useState([])
    const [payment, setPayment] = useState('')
    
    // State for reason modals
    const [showReasonModal, setShowReasonModal] = useState(false)
    const [selectedReason, setSelectedReason] = useState('')
    const [reasonModalTitle, setReasonModalTitle] = useState('Appointment Reason')

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        // Subtract 1 from month number since array is 0-based
        return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2]
    }

    // Getting User Appointments Data Using API
    const getUserAppointments = async () => {
        if (!token) {
            setIsLoading(false)
            return
        }
        
        try {
            setIsLoading(true)
            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
            const newAppointments = data.appointments.reverse()
            
            // Check for status changes
            if (previousAppointments.length > 0) {
                newAppointments.forEach(newApp => {
                    const oldApp = previousAppointments.find(app => app._id === newApp._id)
                    if (oldApp) {
                        // Check for status changes
                        if (oldApp.isCompleted !== newApp.isCompleted || oldApp.cancelled !== newApp.cancelled) {
                            const status = newApp.cancelled ? 'cancelled' : newApp.isCompleted ? 'completed' : 'updated'
                            // Use the correct path to doctor's name based on your data structure
                            const doctorName = newApp.docData ? newApp.docData.name : newApp.docName
                            addNotification({
                                id: Date.now(),
                                type: 'appointment',
                                message: `Your appointment with Dr. ${doctorName} has been ${status}`,
                                timestamp: new Date().toISOString(),
                                read: false
                            })
                        }
                    }
                })
            }
            
            setAppointments(newAppointments)
            setPreviousAppointments(newAppointments)
            setIsAuthenticated(true)

        } catch (error) {
            console.error('Error fetching appointments:', error)
            
            if (error.response && error.response.status === 401) {
                // Token might be expired, try to refresh user data
                try {
                    await loadUserProfileData()
                    // If loadUserProfileData succeeds, retry getting appointments
                    getUserAppointments()
                } catch (refreshError) {
                    setIsAuthenticated(false)
                    toast.error('Authentication error. Please log in again.')
                }
            } else {
                toast.error(error.response?.data?.message || error.message || 'Error loading appointments')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Function to cancel appointment Using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }   

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Appointment Payment',
            description: "Appointment Payment",
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {

                console.log(response)

                try {
                    const { data } = await axios.post(backendUrl + "/api/user/verifyRazorpay", response, { headers: { token } });
                    if (data.success) {
                        navigate('/my-appointments')
                        getUserAppointments()
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error.message)
                }
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    // Function to make payment using razorpay
    const appointmentRazorpay = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-razorpay', { appointmentId }, { headers: { token } })
            if (data.success) {
                initPay(data.order)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to make payment using stripe
    const appointmentStripe = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-stripe', { appointmentId }, { headers: { token } })
            if (data.success) {
                const { session_url } = data
                window.location.replace(session_url)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Check authentication and load appointments when component mounts or token changes
    useEffect(() => {
        const checkAuthAndLoadData = async () => {
            if (token) {
                try {
                    // Verify token is valid by loading user profile
                    await loadUserProfileData()
                    setIsAuthenticated(true)
                    getUserAppointments()
                } catch (error) {
                    setIsAuthenticated(false)
                    setIsLoading(false)
                }
            } else {
                setIsAuthenticated(false)
                setIsLoading(false)
            }
        }
        
        checkAuthAndLoadData()
    }, [token])

    // Add WebSocket or Server-Sent Events listener for real-time updates
    useEffect(() => {
        // Only set up EventSource if authenticated
        if (!token || !isAuthenticated) {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
                eventSourceRef.current = null
            }
            return
        }

        // Close any existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
        }

        // Create EventSource for SSE with error handling
        try {
            const cleanToken = token.replace('Bearer ', '')
            eventSourceRef.current = new EventSource(`${backendUrl}/api/user/appointment-updates?token=${cleanToken}`);
            
            eventSourceRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'appointment_update') {
                        addNotification(data.message);
                        getUserAppointments(); // Refresh appointments list
                    }
                } catch (parseError) {
                    console.error('Error parsing SSE message:', parseError);
                }
            };

            eventSourceRef.current.onerror = (error) => {
                console.error('SSE Error:', error);
                // Don't immediately close on error - the browser will try to reconnect
                // Only close if we detect an auth error (401)
                if (error.status === 401) {
                    eventSourceRef.current.close();
                    eventSourceRef.current = null;
                }
            };
        } catch (error) {
            console.error('Error setting up EventSource:', error);
        }

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [token, backendUrl, isAuthenticated]);

    return (
        <div>
            <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My appointments</p>
            
            {isLoading && (
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                </div>
            )}
            
            {!isLoading && !isAuthenticated && (
                <div className="py-8 text-center">
                    <p className="text-gray-600 mb-4">Please log in to view your appointments</p>
                    <button 
                        onClick={() => navigate('/login')} 
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            )}
            <div className=''>
                {appointments.map((item, index) => (
                    <div key={index} className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b'>
                        <div>
                            <img className='w-36 bg-[#EAEFFF]' src={item.docData.image} alt="" />
                        </div>
                        <div className='flex-1 text-sm text-[#5E5E5E]'>
                            <p className='text-[#262626] text-base font-semibold'>Dr. {item.docData.name}</p>
                            <p>{item.docData.speciality}</p>
                            <p className='text-[#464646] font-medium mt-1'>Address:</p>
                            <p className=''>{item.docData.address.line1}</p>
                            <p className=''>{item.docData.address.line2}</p>
                            <p className=' mt-1'><span className='text-sm text-[#3C3C3C] font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} |  {item.slotTime}</p>
                            {item.appointmentReason && (
                                <button 
                                    onClick={() => {
                                        setSelectedReason(item.appointmentReason);
                                        setReasonModalTitle('Appointment Reason');
                                        setShowReasonModal(true);
                                    }}
                                    className="mt-2 text-sm px-3 py-1 bg-[#EAEFFF] text-primary border border-primary/20 rounded-full hover:bg-primary/10 transition-colors"
                                >
                                    View Appointment Reason
                                </button>
                            )}
                            {item.consultationSummary && (
                                <button 
                                    onClick={() => {
                                        setSelectedReason(item.consultationSummary);
                                        setReasonModalTitle('Consultation Summary');
                                        setShowReasonModal(true);
                                    }}
                                    className="mt-2 ml-2 text-sm px-3 py-1 bg-green-50 text-green-600 border border-green-200 rounded-full hover:bg-green-100 transition-colors"
                                >
                                    View Consultation Summary
                                </button>
                            )}
                        </div>
                        <div></div>
                        <div className='flex flex-col gap-2 justify-end text-sm text-center'>
                            {!item.cancelled && item.payment && !item.isCompleted && <button className='sm:min-w-48 py-2 border rounded text-[#696969]  bg-[#EAEFFF]'>Paid</button>}

                            {item.isCompleted && (
                                <div>
                                    <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Approved</button>
                                    {!item.consultationSummary && (
                                        <p className="text-xs text-gray-500 mt-1">Consultation summary pending</p>
                                    )}
                                </div>
                            )}

                            {!item.cancelled && !item.isCompleted && <button onClick={() => cancelAppointment(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel appointment</button>}
                            {item.cancelled && !item.isCompleted && (
                                <div>
                                    <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment cancelled</button>
                                    {item.cancellationReason && (
                                        <div className="mt-2 text-center">
                                            <button 
                                                onClick={() => {
                                                    setSelectedReason(item.cancellationReason);
                                                    setReasonModalTitle('Cancellation Reason');
                                                    setShowReasonModal(true);
                                                }}
                                                className="text-sm px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full hover:bg-red-100 transition-colors"
                                            >
                                                View Reason
                                            </button>
                                            <p className="text-xs italic text-gray-500 mt-1">
                                                {item.cancelledBy === 'admin' ? 'Cancelled by admin' : 
                                                 item.cancelledBy === 'doctor' ? `Cancelled by Dr. ${item.docData.name}` : 
                                                 'Cancelled by you'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Reason Modal */}
            <AppointmentReasonModal
                isOpen={showReasonModal}
                onClose={() => {
                    setShowReasonModal(false);
                    setSelectedReason('');
                }}
                appointmentReason={selectedReason}
                title={reasonModalTitle}
            />
        </div>
    )
}

export default MyAppointments
