import React from "react";
import "./DescriptionBox.css";

const DescriptionBox = () => {
  return (
    <div className="descriptionbox">
      <div className="descriptionbox-navigator">
        
        <div className="descriptionbox-nav-box fade">Sobre la tienda</div>
      </div>
      <div className="descriptionbox-description">
        <p>
        Bienvenido a Clark's.
        </p>
        <p>
        Somos una tienda especializada en ropa deportiva de alta calidad,
        donde encontrarás las mejores marcas, estilo y comodidad 
        para acompañarte en tu día a día, ya sea en el gimnasio,
        en la calle o en casa. 
        Nuestro objetivo es impulsarte a dar lo mejor de ti, 
        con prendas especiales para rendir, moverte y destacar.
        </p>
        
      </div>
    </div>
  );
};

export default DescriptionBox;
