import React from 'react'
import { GitHubSignInButton } from '../components/GitHubSignInButton'
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export const SignUp = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting }, } = useForm();
  const [availability, setAvalaiblity] = useState("")
  const [availabilityState, setAvalaiblityState] = useState(false)
  const [isCreating, setCreating] = useState(false)
  const [status, setStatus] = useState('doing')
  const [keyMenu, setKeyMenu] = useState(false)
  const [key, setKey] = useState('ASFASDFSD')

  const createAccount = async (data) => {
    setCreating(true)
    const res = await fetch(`/api/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data }) })
    const res_data = await res.json()
    const { success, key } = res_data
    if (success) {
      setStatus('success')
      await setTimeout(() => {
        setKey(key)
        setKeyMenu(true)
      }, 1000);
    }

  }

  const checkUserNameAvailable = async (event) => {
    const username = event.target.value
    if (username == "") {
      setAvalaiblity("")
      setAvalaiblityState(false)
      return
    }

    if (username.includes('@') || username.includes('.') || username.includes('/') || username.match(/^\d/)) {
      setAvalaiblity("Username must not include @ / . and must not start with number")
      setAvalaiblityState(false)
      return
    }

    const res = await fetch(`/api/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ 'username': username }) })
    const res_data = await res.json()

    const { validate } = res_data
    if (validate) {
      setAvalaiblity("Availaible")
      setAvalaiblityState(true)
    }
    else {
      setAvalaiblity("Not Availaible")
      setAvalaiblityState(false)
    }
  }

  const handleGitHubLogin = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectURL = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user`

    window.location.href = redirectURL
  };

  return (

    <div className='flex flex-col items-center gap-5 pt-25'>
      {keyMenu ? <div className='bg-[rgb(39,43,44)] max-w-150 w-full min-h-75 h-full flex flex-col items-center p-5 gap-5'>
        <span className='text-yellow-300 text-2xl font-semibold'>SECRET KEY</span>
        <span className='text-white text-md font-semibold self-center'>COPY the secret and SAVE it somewhere in your device. You'll use it later for decrypting your saved passwords. The purpose of the key is to ensure that only you can see the passwords. Learn more.</span>
        <input type="text" disabled='true' className='max-w-full w-full bg-[rgb(29,32,32)] min-h-10 rounded-xl pl-3 text-yellow-300 font-semibold ' value={key} />
        <div className='flex gap-3'>
          <button onClick={async () => { await navigator.clipboard.writeText(key); }} className='outline-2 text-yellow-300 outline-yellow-300 rounded-2xl p-2 pl-4 pr-4 hover:cursor-pointer hover:outline-yellow-400 hover:text-yellow-400'>Copy</button>
          <button onClick={() => { navigate('/login') }} className='outline-2 text-yellow-300 outline-yellow-300 rounded-2xl p-2 pl-4 pr-4 hover:cursor-pointer hover:outline-yellow-400 hover:text-yellow-400'>OK</button>
        </div>
      </div> : (isCreating ? <div className='flex flex-col items-center mt-50'>
        <LoadingSpinner finished={status} />
        <span className='text-yellow-300 text-2xl'>{status == 'success' ? 'Account Created' : 'Creating Your Account...'}</span>
      </div> : <>
        <GitHubSignInButton handler={handleGitHubLogin} />
        <span className='text-yellow-300 text-2xl'>or</span>
        <form onSubmit={handleSubmit(createAccount)} action={''}>
          <div className="bg-yellow-300 w-120 min-h-110 shadow-lg shadow-black p-10 flex flex-col gap-6">
            <div className='flex items-center gap-10'>
              <div className='flex flex-col gap-4'>
                <label htmlFor="firstname" className='text-xl font-semibold'>First Name</label>
                <input type="text" name='firstname' className='bg-[rgb(21,23,24)] min-h-9 text-yellow-300 pl-3 max-w-40' {...register('firstname', { required: 'First Name is required' })} />
                {errors.firstname && <span className='text-red-500 font-medium'>{errors.firstname.message}</span>}

              </div>

              <div className='flex flex-col gap-4'>

                <label htmlFor="lastname" className='text-xl font-semibold'>Last Name</label>
                <input type="text" name='lastname' className='bg-[rgb(21,23,24)] min-h-9 text-yellow-300 pl-3 max-w-40' {...register('lastname', { required: 'Last Name is required' })} />
                {errors.lastname && <span className='text-red-500 font-medium'>{errors.lastname.message}</span>}
              </div>
            </div>

            <div className='flex flex-col gap-3'>
              <label htmlFor="username" className='text-xl font-semibold'>Username</label>
              <div className='flex items-center gap-3'>
                <input type="text" name='username' className='bg-[rgb(21,23,24)] min-h-10 max-w-50 text-yellow-300 pl-3' {...register('username', { required: 'Username is required', onChange: checkUserNameAvailable })} />
                <span className='text-[rgb(21,23,24)] text-lg font-semibold'>@passly.com</span>

              </div>
              {errors.username ? <span className='text-red-500 font-medium'>{errors.username.message}</span> : <span className={`${availabilityState ? 'text-green-900' : 'text-red-500'} font-medium`}>{availability}</span>}

              <label htmlFor="password" className='text-xl font-semibold'>Password</label>
              <input type="password" name='password' className='bg-[rgb(21,23,24)] min-h-10 text-yellow-300 pl-3' {...register('password', { required: 'Password is required' })} />
              {errors.password && <span className='text-red-500 font-medium'>{errors.password.message}</span>}

              <button type='submit' className='bg-[rgb(21,23,24)] max-w-20 text-yellow-300 min-h-10 self-end w-full mt-5 hover:cursor-pointer hover:scale-110 transition-transform'>Sign Up</button>
            </div>
          </div>
        </form>
      </>)}
    </div>
  )
}
