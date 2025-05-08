import React, { useEffect, useState } from "react";
import "./CSS/ShopCategory.css";
import dropdown_icon from '../Components/Assets/dropdown_icon.png'
import Item from "../Components/Item/Item";
import { Link } from "react-router-dom";

const ShopCategory = (props) => {
  const [allproducts, setAllProducts] = useState([]);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortBy, setSortBy] = useState('default');

  const fetchInfo = () => { 
    fetch('http://localhost:4000/allproducts') 
      .then((res) => res.json()) 
      .then((data) => setAllProducts(data))
  }

  useEffect(() => {
    fetchInfo();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSortOptions) {
        const sortContainer = document.querySelector('.shopcategory-sort');
        if (sortContainer && !sortContainer.contains(e.target)) {
          setShowSortOptions(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSortOptions]);

  const handleSort = (option) => {
    setSortBy(option);
    setShowSortOptions(false);
  };

  const toggleSortOptions = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSortOptions(!showSortOptions);
  };

  const handleOptionClick = (e, option) => {
    e.preventDefault();
    e.stopPropagation();
    handleSort(option);
  };

  const getSortedProducts = () => {
    const categoryProducts = allproducts.filter(item => props.category === item.category);
    
    switch(sortBy) {
      case 'name-asc':
        return [...categoryProducts].sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return [...categoryProducts].sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc':
        return [...categoryProducts].sort((a, b) => a.new_price - b.new_price);
      case 'price-desc':
        return [...categoryProducts].sort((a, b) => b.new_price - a.new_price);
      default:
        return categoryProducts;
    }
  };
    
  return (
    <div className="shopcategory">
      <img src={props.banner} className="shopcategory-banner" alt="" />
      <div className="shopcategory-indexSort">
        <p><span>Mostrando los artículos disponibles</span></p>
        <div className="shopcategory-sort">
          <button 
            type="button" 
            onClick={toggleSortOptions}
            className="sort-button"
          >
            Filtrar <img src={dropdown_icon} alt="" />
          </button>
          {showSortOptions && (
            <div 
              className="sort-options"
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={(e) => handleOptionClick(e, 'name-asc')}>Nombre (A-Z)</button>
              <button type="button" onClick={(e) => handleOptionClick(e, 'name-desc')}>Nombre (Z-A)</button>
              <button type="button" onClick={(e) => handleOptionClick(e, 'price-asc')}>Precio (Menor a Mayor)</button>
              <button type="button" onClick={(e) => handleOptionClick(e, 'price-desc')}>Precio (Mayor a Menor)</button>
            </div>
          )}
        </div>
      </div>
      <div className="shopcategory-products">
        {getSortedProducts().map((item, i) => (
          <Item 
            key={i} 
            id={item.id} 
            name={item.name} 
            image={item.image}  
            new_price={item.new_price} 
            old_price={item.old_price}
          />
        ))}
      </div>
      <div className="shopcategory-loadmore">
        <Link to='/' style={{ textDecoration: 'none' }}>Descubre más</Link>
      </div>
    </div>
  );
};

export default ShopCategory;
