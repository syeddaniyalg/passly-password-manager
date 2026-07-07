import React, { useEffect } from 'react'
import { LoadingSpinner } from './../components/LoadingSpinner'
import { useSearchParams } from 'react-router-dom';

export const Callback = () => {
    const [searchParams] = useSearchParams();
    useEffect(() => {
        ( async () => {
            const code = searchParams.get('code');
            const SERVER_URL = import.meta.env.VITE_SERVER_URL
            const res = await fetch(`${SERVER_URL}/api/auth/`, {method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'github', code: code })})
            const res_data = await res.json()
            console.log(res_data)
        })()

    }, [])

    return (
        <div className='flex flex-col items-center mt-50'>
            <LoadingSpinner />
            <span className='text-yellow-300 text-2xl'>Authenticating...</span>
        </div>
    )
}
