import React from 'react'
import './NewsLetter.css'

const NewsLetter = () => {
  return (
    <div className='newsletter'>
      <h1>Recibe ofertas exclusivas</h1>
      <p>Subscribete para recibir actualizaciones sobre ofertas exclusivas para ti.</p>
      <div>
        <input type="email" placeholder='Correo electrónico' />
        <button>Aceptar</button>
      </div>
    </div>
  )
}

export default NewsLetter
