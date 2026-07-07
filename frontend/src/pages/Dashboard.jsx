import React from 'react'
import { useEffect } from 'react'
import { useStore } from './../components/store.js'
import { useNavigate } from 'react-router-dom'

export const Dashboard = () => {
    const fullName = useStore((state) => state.fullName)
    const setFullName = useStore((state) => state.setFullName)
    const auth = useStore((state) => state.auth)
    const setAuth = useStore((state) => state.setAuth)
    const setStatus = useStore((state) => state.setStatus)
    const navigate = useNavigate()
    useEffect(() => { (async () => {
            setStatus('loading')
            const SERVER_URL = import.meta.env.VITE_SERVER_URL
            const res = await fetch(`${SERVER_URL}/api/getname`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({}) })
            const res_data = await res.json()
            const { auth, ...data } = res_data
            console.log(auth)
            if (auth) {
                const { name } = data
                setAuth(true)
                setFullName(name)
                setStatus('loaded')
                console.log(status)
            }
            else
            {
                setStatus('loaded')
                console.log(status)
                navigate('/')
            }
        })()
    }, [])

    return (
        <div>Dashboard</div>
    )
}
