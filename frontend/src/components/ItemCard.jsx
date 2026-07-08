import React from 'react'
import { EditIcon } from '../components/EditIcon.jsx'
import { DeleteIcon } from '../components/DeleteIcon.jsx'
import { ShowIcon } from './ShowIcon.jsx'

export const ItemCard = ({
    itemTitle, 
    itemEmail, 
    passwordHash, 
    lastUpdated, 
    onEdit, 
    onView, 
    onCopy,
    onDelete // Added onDelete prop
}) => {
    return (
        <div className='w-full bg-[rgb(28,31,34)] min-h-10 flex lg:grid-cols-5 lg:grid lg:place-items-center lg:place-content-center flex-col gap-2 lg:items-center justify-between p-5 lg:pt-0 lg:pb-0 pl-3 pr-3 text-white rounded-xl border border-transparent hover:border-[rgb(78,83,87)] transition-colors'>
            <span className='font-bold text-xl place-self-start'>{itemTitle}</span>
            
            <div className='flex gap-2 items-center'>
                <span className="truncate max-w-[200px] lg:max-w-full" title={itemEmail}>{itemEmail}</span>
             </div>

            <div className='flex gap-2 lg:gap-3 items-center'>
                <input 
                    disabled={true}  
                    className='outline-1 rounded-xl pt-1 pb-1 pl-3 max-w-24 lg:max-w-40 w-full outline-[rgb(78,83,87)] font-semibold bg-transparent text-white' 
                    type="text" 
                    value={passwordHash}
                />
                
                {/* Wrapped in a button to handle onClick properly */}
                <button 
                    type="button" 
                    onClick={onView} 
                    className="cursor-pointer text-[rgb(144,154,163)] hover:text-yellow-300 transition-colors"
                    title="Toggle Password Visibility"
                >
                    <ShowIcon/>
                </button>

                <button 
                    type="button" 
                    onClick={onCopy} 
                    className='outline outline-1 p-1 pl-3 pr-3 rounded-xl outline-[rgb(78,83,87)] text-[rgb(144,154,163)] cursor-pointer hover:bg-[rgb(78,83,87)] hover:text-white transition-all text-sm'
                >
                    Copy
                </button>
            </div>

            <span className="text-sm text-[rgb(144,154,163)]">
                Last updated: <span className="text-white">{lastUpdated}</span>
            </span>

            <div className='flex items-center gap-4 justify-self-end'>
                <button 
                    type="button" 
                    onClick={onEdit} 
                    className="cursor-pointer text-[rgb(144,154,163)] hover:text-yellow-300 transition-colors"
                    title="Edit Item"
                >
                    <EditIcon/>
                </button>
                <button 
                    type="button" 
                    onClick={onDelete} // Attached onDelete handler
                    className="cursor-pointer text-[rgb(144,154,163)] hover:text-red-500 transition-colors"
                    title="Delete Item"
                >
                    <DeleteIcon/>
                </button>
            </div>
        </div>
    )
}