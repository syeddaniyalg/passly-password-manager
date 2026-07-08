import React, { useState, useEffect, useMemo } from 'react'
import { useStore } from './../components/store.js'
import { useNavigate } from 'react-router-dom'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react'
import { ItemCard } from '../components/ItemCard.jsx'

const sortOptions = [
    { id: 'az', name: 'By A-Z' },
    { id: 'za', name: 'By Z-A' },
    { id: 'date', name: 'By Date' }
]

const timeAgo = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.round((now - date) / 1000)
    const minutes = Math.round(seconds / 60)
    const hours = Math.round(minutes / 60)
    const days = Math.round(hours / 24)

    if (seconds < 60) return `${Math.max(seconds, 0)} seconds ago`
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${days} day${days > 1 ? 's' : ''} ago`
}

const calculatePasswordScore = (password) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 10;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    return Math.min(score, 100);
}

const getScoreColor = (score) => {
    if (score === 0) return 'bg-transparent';
    if (score < 50) return 'bg-red-500';
    if (score < 80) return 'bg-yellow-400';
    return 'bg-green-500';
}

const getScoreTextColor = (score) => {
    if (score === 0) return 'text-white';
    if (score < 50) return 'text-red-500';
    if (score < 80) return 'text-yellow-400';
    return 'text-green-500';
}

export const Dashboard = () => {
    const fullName = useStore((state) => state.fullName)
    const setFullName = useStore((state) => state.setFullName)
    const auth = useStore((state) => state.auth)
    const setAuth = useStore((state) => state.setAuth)
    const setStatus = useStore((state) => state.setStatus)
    const navigate = useNavigate()
    
    const [items, setItems] = useState([])
    
    const [phase, setPhase] = useState('static')
    const [vaultKey, setVaultKey] = useState('')
    const [key, setKey] = useState('') 
    const [keyError, setKeyError] = useState('')
    
    const [pendingAction, setPendingAction] = useState(null)
    const [decryptedPasswords, setDecryptedPasswords] = useState({}) 

    const [selected, setSelected] = useState(sortOptions[0])
    const [query, setQuery] = useState('')
    
    const [formData, setFormData] = useState({ title: '', email: '', password: '', _id: null })
    const [showPassword, setShowPassword] = useState(false)
    const [passwordScore, setPasswordScore] = useState(0)
    const [formError, setFormError] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const weakPasswordsCount = useMemo(() => {
        return items.filter(item => (item.score || 0) < 50).length;
    }, [items]);

    const averageSecurityScore = useMemo(() => {
        if (items.length === 0) return 0;
        const totalScore = items.reduce((acc, curr) => acc + (curr.score || 0), 0);
        return Math.round(totalScore / items.length);
    }, [items]);

    const processedItems = useMemo(() => {
        let result = [...items];

        if (query.trim() !== '') {
            result = result.filter(item => 
                item.title.toLowerCase().includes(query.toLowerCase())
            );
        }

        if (selected.id === 'az') {
            result.sort((a, b) => a.title.localeCompare(b.title));
        } else if (selected.id === 'za') {
            result.sort((a, b) => b.title.localeCompare(a.title));
        } else if (selected.id === 'date') {
            result.sort((a, b) => {
                const dateA = new Date(a.data_modified || a.data_created || 0);
                const dateB = new Date(b.data_modified || b.data_created || 0);
                return dateB - dateA; 
            });
        }

        return result;
    }, [items, query, selected]);

    useEffect(() => {
        (async () => {
            setStatus('loading')
            const SERVER_URL = import.meta.env.VITE_SERVER_URL
            
            const res = await fetch(`${SERVER_URL}/api/getname`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                credentials: 'include', 
                body: JSON.stringify({}) 
            })
            const res_data = await res.json()
            const { auth, ...data } = res_data
            
            if (auth) {
                const { name } = data
                setAuth(true)
                setFullName(name)
                setStatus('loaded')

                const listRes = await fetch(`${SERVER_URL}/api/getlist`, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    credentials: 'include', 
                    body: JSON.stringify({}) 
                })

                const { success, items: fetchedItems } = await listRes.json()
                if (success) {
                    setItems(fetchedItems)
                }
            } else {
                setStatus('loaded')
                navigate('/')
            }
        })()
    }, [])

    useEffect(() => {
        setDecryptedPasswords({})
    }, [items])

    const handleAction = (type, index = null) => {
        const targetItem = processedItems[index];
        const realIndex = type !== 'add' ? items.findIndex(item => item._id === targetItem._id) : null;

        if (type === 'view' && decryptedPasswords[realIndex]) {
            setDecryptedPasswords({})
            return
        }

        if (type === 'delete') {
            setPendingAction({ type, index: realIndex })
            setPhase('deleteConfirm')
            return
        }

        setPendingAction({ type, index: realIndex })
        setKeyError('')
        setPhase('key')
    }

    const executeAction = async (type, index, currentKey) => {
        if (type === 'add') {
            resetForm()
            setPendingAction({ type: 'add' })
            setPhase('passworddialog')
            return
        }

        const item = items[index]
        try {
            const SERVER_URL = import.meta.env.VITE_SERVER_URL
            const res = await fetch(`${SERVER_URL}/api/decrypt-key`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ password_hash: item.password_hash, key: currentKey })
            })

            const data = await res.json()

            if (data.success) {
                const plainPassword = data.password

                if (type === 'view') {
                    setDecryptedPasswords({ [index]: plainPassword })
                    setPhase('static')
                    setPendingAction(null)
                    setKey('') 
                } else if (type === 'copy') {
                    navigator.clipboard.writeText(plainPassword)
                    setPhase('static')
                    setPendingAction(null)
                    setKey('') 
                } else if (type === 'edit') {
                    setFormData({ title: item.title, email: item.email, password: plainPassword, _id: item._id })
                    setPasswordScore(calculatePasswordScore(plainPassword))
                    setPendingAction({ type: 'edit', index })
                    setPhase('passworddialog')
                }
            } else {
                setKeyError('Decryption failed, key might be incorrect.')
                if (phase !== 'key') setPhase('key')
            }
        } catch (error) {
            console.error("Action execution error:", error)
            setKeyError('Server error while decrypting.')
        }
    }

    const resetForm = () => {
        setFormData({ title: '', email: '', password: '', _id: null })
        setPasswordScore(0)
        setFormError('')
        setShowPassword(false)
    }

    const handleUnlock = async () => {
        if (!vaultKey) {
            setKeyError('Please enter your key')
            return
        }

        try {
            const SERVER_URL = import.meta.env.VITE_SERVER_URL
            const res = await fetch(`${SERVER_URL}/api/validatekey`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ key: vaultKey })
            })

            const data = await res.json()

            if (data.success) {
                const currentActionType = pendingAction?.type
                const currentActionIndex = pendingAction?.index

                if (currentActionType === 'add' || currentActionType === 'edit') {
                    setKey(vaultKey) 
                }
                
                const validKey = vaultKey
                setVaultKey('')
                setKeyError('')

                executeAction(currentActionType, currentActionIndex, validKey)
            } else {
                setKeyError('Invalid key')
            }
        } catch (error) {
            console.error(error)
            setKeyError('Server error validating key')
        }
    }

    const handlePasswordChange = (e) => {
        const val = e.target.value
        setFormData({ ...formData, password: val })
        setPasswordScore(calculatePasswordScore(val))
    }

    const handleSaveLogin = async () => {
        setFormError('')
        
        if (!formData.title.trim() || !formData.email.trim() || !formData.password) {
            setFormError('All fields are required.')
            return
        }

        setIsSaving(true)

        try {
            const SERVER_URL = import.meta.env.VITE_SERVER_URL
            const isEdit = pendingAction?.type === 'edit'
            const endpoint = isEdit ? '/api/update-item' : '/api/additem'

            const payload = {
                item: {
                    _id: formData._id,
                    title: formData.title,
                    email: formData.email,
                    password: formData.password,
                    score: passwordScore
                },
                key: key
            }

            const res = await fetch(`${SERVER_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (data.success) {
                setItems(data.items) 
                setPhase('static')
                setPendingAction(null)
                setKey('') 
                resetForm()
            } else {
                setFormError(data.message || 'Failed to save login.')
            }
        } catch (error) {
            console.error(error)
            setFormError('A network error occurred while saving.')
        } finally {
            setIsSaving(false)
        }
    }

    const executeDelete = async () => {
        setIsDeleting(true)
        setFormError('')
        
        try {
            const SERVER_URL = import.meta.env.VITE_SERVER_URL
            const itemToDelete = items[pendingAction.index]

            const payload = {
                item: itemToDelete
            }

            const res = await fetch(`${SERVER_URL}/api/deleteItem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (data.success) {
                setItems(data.items)
                setPhase('static')
                setPendingAction(null)
            } else {
                setFormError(data.message || 'Failed to delete item.')
            }
        } catch (error) {
            console.error(error)
            setFormError('A network error occurred while deleting.')
        } finally {
            setIsDeleting(false)
        }
    }

    const modalInputClass = "w-full bg-[rgb(21,23,26)] p-3 text-yellow-300 placeholder:text-[rgb(144,154,163)] outline outline-1 outline-[rgb(78,83,87)] focus:outline-yellow-300 rounded-xl transition-all"

    return (
        <div className='relative'>
            <div className='flex flex-col gap-5 z-0 top-0 left-0'>
                <div className='flex justify-between'>
                    <span className='text-yellow-300 text-2xl md:text-4xl font-semibold '>Vault Dashboard</span>
                    <button 
                        onClick={() => handleAction('add')}
                        className='bg-yellow-300 pl-5 pr-5 rounded-xl font-semibold hover:cursor-pointer hover:bg-yellow-400 active:bg-yellow-500'
                    >
                        + Add New Password
                    </button>
                </div>
                
                <div className='flex gap-4'>
                    <div className='max-w-70 w-full text-white min-h-10 flex gap-2 pl-2 md:pl-5 pr-2 md:pr-0 items-center bg-[rgb(28,31,34)] font-semibold text-sm md:text-lg'>
                        Total Logins:<span className='text-yellow-300'>{items.length}</span>
                    </div>
                    <div className='max-w-70 w-full text-white min-h-10 flex gap-2 pl-2 md:pl-5 pr-2 md:pr-0 items-center bg-[rgb(28,31,34)] font-semibold text-sm md:text-lg'>
                        Weak Passwords:<span className={weakPasswordsCount > 0 ? 'text-red-500' : 'text-green-500'}>{weakPasswordsCount}</span>
                    </div>
                    <div className='max-w-70 w-full text-white min-h-10 flex gap-2 pl-2 md:pl-5 items-center pr-2 md:pr-0 bg-[rgb(28,31,34)] font-semibold text-sm md:text-lg'>
                        Security Score:<span className={getScoreTextColor(averageSecurityScore)}>{averageSecurityScore}%</span>
                    </div>
                </div>

                <div className='flex items-center gap-2'>
                    <input 
                        type="text" 
                        placeholder='Search logins by title....' 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        className='w-full bg-[rgb(28,31,34)] p-1 pl-3 text-yellow-300 placeholder:text-[rgb(144,154,163)] outline-1 outline-[rgb(78,83,87)] rounded-xl' 
                    />

                    <div className="max-w-22 w-full">
                        <Listbox value={selected} onChange={setSelected}>
                            <div className="relative mt-1">
                                <ListboxButton className="relative w-full px-3 py-2 text-left text-sm text-[rgb(144,154,163)] bg-[rgb(28,31,34)] border border-[rgb(78,83,87)] rounded-md cursor-pointer focus:outline-none focus:ring-2">
                                    <span className="block truncate">{selected.name}</span>
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </ListboxButton>

                                <ListboxOptions className="absolute z-10 w-full mt-1 overflow-auto text-sm bg-[rgb(28,31,34)] border border-[rgb(78,83,87)] rounded-md shadow-lg max-h-60 focus:outline-none">
                                    {sortOptions.map((option) => (
                                        <ListboxOption
                                            key={option.id}
                                            value={option}
                                            className="cursor-pointer select-none px-3 py-2 text-[rgb(144,154,163)] data-focus:bg-[rgb(21,23,26)]">
                                            {option.name}
                                        </ListboxOption>
                                    ))}
                                </ListboxOptions>
                            </div>
                        </Listbox>
                    </div>
                </div>
                
                <div className='flex flex-col w-full gap-2'>
                    {processedItems.length > 0 ? (
                        processedItems.map((item, index) => {
                            const realIndex = items.findIndex(masterItem => masterItem._id === item._id);
                            return (
                                <ItemCard 
                                    key={item._id || index} 
                                    itemTitle={item.title} 
                                    itemEmail={item.email} 
                                    passwordHash={decryptedPasswords[realIndex] || "••••••••••••"} 
                                    lastUpdated={timeAgo(item.data_modified)} 
                                    onEdit={() => handleAction('edit', index)}
                                    onView={() => handleAction('view', index)}
                                    onCopy={() => handleAction('copy', index)}
                                    onDelete={() => handleAction('delete', index)}
                                />
                            )
                        })
                    ) : (
                        <div className="text-[rgb(144,154,163)] text-center mt-10 font-medium">
                            {items.length === 0 ? "No logins saved in your vault yet." : "No results match your query search criteria."}
                        </div>
                    )}
                </div>
            </div>

            {phase !== 'static' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[rgb(28,31,34)] rounded-xl border border-[rgb(78,83,87)] shadow-2xl p-6 md:p-8">
                        
                        <button
                            onClick={() => { 
                                setPhase('static')
                                setPendingAction(null)
                                setVaultKey('')
                                setKey('') 
                                setKeyError('')
                                resetForm()
                                setFormError('')
                            }}
                            className="absolute top-4 right-4 text-[rgb(144,154,163)] hover:text-yellow-300 transition-colors"
                            aria-label="Close"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {phase === 'key' && (
                            <form onSubmit={(e) => { e.preventDefault(); handleUnlock(); }} className="mt-2" autoComplete="off">
                                <h2 className="text-yellow-300 text-2xl md:text-3xl font-semibold mb-2">Authentication Required</h2>
                                <p className="text-[rgb(144,154,163)] mb-6 text-sm md:text-base">Please enter your secret key to authorize this action.</p>
                                
                                <input 
                                    type="password" 
                                    placeholder='Enter Secret Key...' 
                                    value={vaultKey}
                                    onChange={(e) => {
                                        setVaultKey(e.target.value)
                                        setKeyError('')
                                    }}
                                    autoComplete="new-password"
                                    autoCapitalize="off"
                                    autoCorrect="off"
                                    spellCheck="false"
                                    data-lpignore="true"
                                    data-1p-ignore="true"
                                    className={`${modalInputClass} ${keyError ? 'outline-red-500 focus:outline-red-500' : ''}`} 
                                />
                                {keyError && <span className="text-red-500 text-sm mt-2 block">{keyError}</span>}
                                
                                <div className="flex justify-end gap-4 mt-8">
                                    <button 
                                        type="button"
                                        onClick={() => { 
                                            setPhase('static')
                                            setPendingAction(null)
                                            setVaultKey('')
                                            setKeyError('')
                                        }} 
                                        className="px-4 py-2 text-[rgb(144,154,163)] hover:text-white font-semibold transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="bg-yellow-300 text-black px-6 py-2 rounded-xl font-semibold hover:bg-yellow-400 active:bg-yellow-500 cursor-pointer transition-colors"
                                    >
                                        Unlock
                                    </button>
                                </div>
                            </form>
                        )}

                        {phase === 'passworddialog' && (
                            <div className="mt-2">
                                <h2 className="text-yellow-300 text-2xl md:text-3xl font-semibold mb-6">
                                    {pendingAction?.type === 'edit' ? 'Edit Password' : 'Add New Password'}
                                </h2>

                                {formError && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm">
                                        {formError}
                                    </div>
                                )}
                                
                                <form onSubmit={(e) => { e.preventDefault(); handleSaveLogin(); }} className="flex flex-col gap-4" autoComplete="off">
                                    <div>
                                        <label className="block text-sm font-medium text-[rgb(144,154,163)] mb-1">Title <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            placeholder='e.g. Google, Netflix' 
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            autoComplete="new-password"
                                            autoCapitalize="off"
                                            autoCorrect="off"
                                            spellCheck="false"
                                            data-lpignore="true"
                                            data-1p-ignore="true"
                                            className={modalInputClass} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[rgb(144,154,163)] mb-1">Username / Email <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            placeholder='john@example.com' 
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            autoComplete="new-password"
                                            autoCapitalize="off"
                                            autoCorrect="off"
                                            spellCheck="false"
                                            data-lpignore="true"
                                            data-1p-ignore="true"
                                            className={modalInputClass} 
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between">
                                            <label className="block text-sm font-medium text-[rgb(144,154,163)] mb-1">Password <span className="text-red-500">*</span></label>
                                            {formData.password && (
                                                <span className={`text-xs font-medium ${passwordScore < 50 ? 'text-red-500' : passwordScore < 80 ? 'text-yellow-400' : 'text-green-500'}`}>
                                                    {passwordScore < 50 ? 'Weak' : passwordScore < 80 ? 'Moderate' : 'Strong'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                placeholder='••••••••••••' 
                                                value={formData.password}
                                                onChange={handlePasswordChange}
                                                autoComplete="new-password"
                                                autoCapitalize="off"
                                                autoCorrect="off"
                                                spellCheck="false"
                                                data-lpignore="true"
                                                data-1p-ignore="true"
                                                className={`${modalInputClass} pr-12`} 
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 px-4 flex items-center text-[rgb(144,154,163)] hover:text-white transition-colors"
                                            >
                                                {showPassword ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <div className="w-full h-1 mt-2 bg-[rgb(21,23,26)] rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-300 ${getScoreColor(passwordScore)}`} 
                                                style={{ width: `${passwordScore}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-4 mt-8">
                                        <button 
                                            type="button"
                                            onClick={() => { 
                                                setPhase('static')
                                                setPendingAction(null)
                                                setKey('') 
                                                resetForm()
                                            }} 
                                            className="px-4 py-2 text-[rgb(144,154,163)] hover:text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={isSaving}
                                            className="bg-yellow-300 text-black px-6 py-2 rounded-xl font-semibold hover:bg-yellow-400 active:bg-yellow-500 cursor-pointer transition-colors flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed"
                                        >
                                            {isSaving ? (
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : 'Save Login'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {phase === 'deleteConfirm' && (
                            <div className="mt-2">
                                <h2 className="text-red-500 text-2xl md:text-3xl font-semibold mb-2">Delete Login?</h2>
                                <p className="text-[rgb(144,154,163)] mb-6 text-sm md:text-base">
                                    Are you sure you want to delete the login for <span className="font-bold text-white">{items[pendingAction?.index]?.title}</span>? This action cannot be undone.
                                </p>

                                {formError && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm">
                                        {formError}
                                    </div>
                                )}
                                
                                <div className="flex justify-end gap-4 mt-8">
                                    <button 
                                        type="button"
                                        onClick={() => { 
                                            setPhase('static')
                                            setPendingAction(null)
                                            setFormError('')
                                        }} 
                                        className="px-4 py-2 text-[rgb(144,154,163)] hover:text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={executeDelete} 
                                        disabled={isDeleting}
                                        className="bg-red-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-red-600 active:bg-red-700 cursor-pointer transition-colors flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting ? (
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : 'Yes, Delete'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}