import React from 'react'
import { useState } from 'react'
import { Button } from '../components/Button'
import { TypeAnimation } from "react-type-animation"
import { Card } from '../components/Card'
import { HRText } from "flowbite-react";
import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from '../components/store'

export const HomePage = () => {
  const navigate = useNavigate()
  const setStatus = useStore((state) => state.setStatus)
  useEffect(() => {
    (async () => {
      setStatus('loading')
      const SERVER_URL = import.meta.env.VITE_SERVER_URL
      const res = await fetch(`${SERVER_URL}/api/verify_auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' },credentials: 'include', body: JSON.stringify({check:true})})
      const res_data = await res.json()
      const {auth} = res_data
      console.log(auth)
      if (auth)
      {
        navigate('/dashboard')
      }

      setStatus('loaded')
    })()
  }, [])

  return (
    <>
      <div className='flex flex-col m-20 gap-10 items-start'>
        <div className='text-yellow-300 text-8xl font-semibold'><TypeAnimation
          sequence={[
            'Passly'
          ]}
          repeat={0}
          cursor={false} /></div>

        {/* <span className='text-yellow-300 text-8xl font-semibold'>Passly</span> */}
        <div className='text-yellow-300 text-4xl flex flex-col sm:flex-row gap-3'>
          <span>Secure. </span>
          <span className='bg-yellow-300 pl-4 pr-4 text-black rounded-4xl p-1'>Trustable.</span>
          <span> Encrypted.</span>
        </div>

        <div className='flex gap-5'>
          <Link to='signup'><Button className="" text='Create A New Account'></Button></Link>
          <Link to='login'><button className='text-yellow-300 outline-yellow-300 outline-2 p-2 pl-4 pr-4 rounded-2xl hover:cursor-pointer hover:outline-dashed hover:text-yellow-400 hover:outline-yellow-400 transition-all'>Log In</button></Link>
        </div>

        <div className='mt-20 flex flex-col gap-20 mx-auto'>
          <HRText className='text-yellow-300' />
          <span className='text-yellow-300 text-7xl mx-auto font-bold'>Our Pillars</span>
          <div className='flex flex-col gap-30'>
            <Card bodytext="Passly uses advanced security protocols to ensure your credentials remain completely inaccessible to outside threats. From brute-force mitigation to automated security audits of your master password, your vault is continuously shielded against evolving cyber vulnerabilities."
              heading={"Why Secure?"}
              titletext={"Security"}
              cardfirst={true}></Card>

            <Card bodytext={"Trust isn't given; it’s proven. Passly operates on a strict zero-knowledge architecture, meaning we never store, see, or have access to your master password or data. With open-source transparency at our core, you don't have to take our word for it—our code speaks for itself."}
              heading={"Why trustful?"}
              titletext={"Trust"}
              cardfirst={false}></Card>

            <Card bodytext={"Data payloads undergo local symmetric encryption before network transmission, utilizing industry-standard AES-256-GCM (Galois/Counter Mode) to guarantee both data confidentiality and cryptographic authenticity. Encrypted blobs remain immutable and mathematically indecipherable to transit intermediaries, decryptable only through your locally derived cryptographic key."} titletext={"Encryption"} heading="How encrypted?" cardfirst={true}></Card>
          </div>


        </div>

      </div>
    </>
  )
}
