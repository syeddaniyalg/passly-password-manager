import React from 'react'
import { Button } from 'flowbite-react'
import { GitHubSignInButton } from '../components/GitHubSignInButton'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

export const SignIn = () => {
    const [status, setStatus] = useState('doing')
    const [errorLogin, setErrorLogin] = useState('')
    const navigate = useNavigate();
    const handleGitHubLogin = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const redirectURL = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user`

        window.location.href = redirectURL
    };

    const handleLogin = async (data) => {
        setAuthState(true)

        const res = await fetch(`/api/auth/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ method: 'regular', ...data }) })

        const res_data = await res.json()
        if (res_data['success'] == true) {
            setStatus('success')
            setTimeout(() => {
                navigate('/')
            }, 1000);
        }
        else {
            setStatus('failure')
            setErrorLogin(res_data['error'])
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }

    }

    const [authState, setAuthState] = useState(false)
    const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting }, } = useForm();

    return (
        <>
            <div className='flex flex-col items-center pt-30 gap-5'>
                {authState ? <div className='flex flex-col items-center mt-50'>
                    <LoadingSpinner status={status} />
                    <span className='text-yellow-300 text-2xl'>{status == "success" ? 'Authenticated' : (status == 'failure' ? `Authentication Failed` : 'Authenticating...')}</span>
                    <span className='text-yellow-300 text-2xl'>{status == 'failure' && errorLogin}</span>
                </div> : <><form onSubmit={handleSubmit(handleLogin)} action="">
                    <div className="bg-yellow-300 w-100 min-h-90 shadow-lg shadow-black p-10 flex flex-col gap-4">
                        <label htmlFor="username" className='text-2xl font-semibold'>Username</label>
                        <input type="text" name='username' className='bg-[rgb(21,23,24)] min-h-10 text-yellow-300 pl-3' {...register('username', { required: 'Username is required' })} />
                        {errors.username && <span className='text-red-500 font-medium'>{errors.username.message}</span>}
                        <label htmlFor="password" className='text-2xl font-semibold'>Password</label>
                        <input type="password" name='password' className='bg-[rgb(21,23,24)] min-h-10 text-yellow-300 pl-3' {...register('password', { required: 'Password is required' })} />
                        {errors.password && <span className='text-red-500 font-medium'>{errors.password.message}</span>}
                        <button type='submit' className='bg-[rgb(21,23,24)] max-w-20 text-yellow-300 min-h-10 self-end w-full hover:cursor-pointer hover:scale-110 transition-transform'>Login</button>
                    </div>
                </form>
                    <span className='text-yellow-300 text-2xl'>or</span>
                    <GitHubSignInButton handler={(e) => { handleGitHubLogin(e) }} /></>}
            </div>
        </>
    )
}
