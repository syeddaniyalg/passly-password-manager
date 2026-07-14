import React, { useEffect } from 'react'
import { LoadingSpinner } from './../components/LoadingSpinner'
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';

export const Callback = () => {
    const [status, setStatus] = useState('doing')
    const [searchParams] = useSearchParams();
    const [key, setKey] = useState('');
    const [keyMenu, setKeyMenu] = useState(false)

    const navigate = useNavigate()
    useEffect(() => {
        (async () => {
            const code = searchParams.get('code');
            const res = await fetch(`/api/auth/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ method: 'github', code: code }) })
            const res_data = await res.json()
            console.log(res_data)
            if (res_data['success'] == true) {
                setStatus('success')
                setTimeout(() => {
                    if (res_data['key']) {
                        setKey(res_data['key'])
                        setKeyMenu(true)
                    }
                    else
                    {
                        navigate('/')
                    }

                }, 1000);
            }
            else {
                setStatus('failure')
                setErrorLogin(res_data['error'])
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }

        })()

    }, [])

    return (
        <>
        {keyMenu?(<><div className='bg-[rgb(39,43,44)] max-w-150 w-full min-h-75 mx-auto mt-50 h-full flex flex-col items-center p-5 gap-5'>
        <span className='text-yellow-300 text-2xl font-semibold'>SECRET KEY</span>
        <span className='text-white text-md font-semibold self-center'>COPY the secret and SAVE it somewhere in your device. You'll use it later for decrypting your saved passwords. The purpose of the key is to ensure that only you can see the passwords. Learn more.</span>
        <input type="text" disabled='true' className='max-w-full w-full bg-[rgb(29,32,32)] min-h-10 rounded-xl pl-3 text-yellow-300 font-semibold ' value={key} />
        <div className='flex gap-3'>
          <button onClick={async () => { await navigator.clipboard.writeText(key); }} className='outline-2 text-yellow-300 outline-yellow-300 rounded-2xl p-2 pl-4 pr-4 hover:cursor-pointer hover:outline-yellow-400 hover:text-yellow-400'>Copy</button>
          <button onClick={() => { navigate('/') }} className='outline-2 text-yellow-300 outline-yellow-300 rounded-2xl p-2 pl-4 pr-4 hover:cursor-pointer hover:outline-yellow-400 hover:text-yellow-400'>OK</button>
        </div>
      </div></>):<div className='flex flex-col items-center mt-50'>
            <LoadingSpinner status={status} />
            <span className='text-yellow-300 text-2xl'>{status == "success" ? 'Authenticated' : (status == 'failure' ? `Authentication Failed` : 'Authenticating...')}</span>
        </div>}
        </>
        
    )
}
