import React from 'react'
import { Button } from './Button'
import { NavLink } from 'react-router-dom'
import { useStore } from './store.js'
import { LoadingSpinner } from './LoadingSpinner.jsx'
export const NavBar = () => {
  const fullName = useStore((state) => state.fullName)
  const auth = useStore((state)=> state.auth)
  const status = useStore((state)=> state.status)
  return (
    <nav className='bg-[rgb(28,31,34)] justify-between min-h-15 flex items-center shadow-black shadow-md'>
        <img src="icon.png" className='ml-3 pl-2 max-w-12' alt="" />
        <span className='text-yellow-300 font-["Baloo Bhai 2"] text-3xl font-semibold'>Passly</span>
        {(auth ? <span className='text-yellow-300 font-semibold mr-5'>{fullName}</span> : <NavLink to='login'><Button attr="mr-3" text="Sign In"/></NavLink>)}
    </nav>
  )
}
