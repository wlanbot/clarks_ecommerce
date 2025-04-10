import React from 'react'
import './Footer.css'

import footer_logo from '../Assets/clarks_logo.png'
import instagram_icon from '../Assets/instagram_icon.png'
import whatsapp_icon from '../Assets/whatsapp_icon.png'

const Footer = () => {
  return (
    <div className='footer'>
      <div className="footer-blur-effect"></div>
      <div className="footer-logo">
        <img src={footer_logo} alt="" />
        
      </div>
      <ul className="footer-links">
        
        <li>Contactos</li>
      </ul>
      <div className="footer-social-icons">
        <div className="footer-icons-container">
            <img src={instagram_icon} alt="" />
        </div>
        <div className="footer-icons-container">
            <img src={whatsapp_icon} alt="" />
        </div>
      </div>
      <div className="footer-copyright">
        <hr />
        <p>2025 - Todos los derechos reservados.</p>
      </div>
    </div>
  )
}

export default Footer
