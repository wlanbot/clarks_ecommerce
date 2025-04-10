import React from "react";
import "./Hero.css";
import hero_image from "../Assets/collage_hero.png";
import run_icon from "../Assets/run_icon.png";
import arrow_icon from "../Assets/arrow.png";

const Hero = () => {
  return (
    <div className="hero">
      
      <div className="hero-left">
        <h2>Muestra tu estilo.</h2>
        <div>
          <div className="hero-hand-icon">
            <p>Gran</p>
            <img src={run_icon} alt="" />
          </div>
          <p>variedad</p>
          <p>de marcas</p>
        </div>
      </div>
      <div className="hero-right">
      <div className="hero-blur-effect">
      <img src={hero_image} alt="blur background" />
    </div>
        <img src={hero_image} alt="hero" />
      </div>
    </div>
  );
};

export default Hero;
