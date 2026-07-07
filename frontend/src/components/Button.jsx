import React from 'react'

export const Button = ({text, attr}) => {
  return (
     <button className={`bg-yellow-300 text-black rounded-2xl p-2 pl-5 pr-5 font-semibold hover:cursor-pointer hover:bg-yellow-400 transition-all active:bg-[rgb(155,140,4)] ${attr}`}>{text}</button>
  )
}
