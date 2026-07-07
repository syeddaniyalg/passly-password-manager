import React, { useState, useEffect } from 'react'

export const Card = ({ bodytext, titletext, heading, cardfirst }) => {
    const [isLg, setIsLg] = useState(false)

    useEffect(() => {
        const lgQuery = window.matchMedia('(min-width: 1024px)');

        setIsLg(lgQuery.matches);

        const handleLgChange = (e) => setIsLg(e.matches);
        lgQuery.addEventListener('change', handleLgChange);
        return () => lgQuery.removeEventListener('change', handleLgChange);
    }, []);

    return (
        <div className='flex-col lg:flex-row flex justify-center items-center gap-20'>
            {(cardfirst || !isLg) && <span className='font-bold text-6xl text-yellow-300'>{titletext}</span>}

            <div className='bg-yellow-300 max-w-150 flex flex-col shadow-md shadow-black items-center min-h-70 font-medium rounded-4xl text-3xl p-10'>
                <span className='font-bold '>{heading}</span>
                {bodytext}
            </div>

            {!cardfirst && isLg && <span className='font-bold text-6xl text-yellow-300'>{titletext}</span>}
        </div>
    )
}
