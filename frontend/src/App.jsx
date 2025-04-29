import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Shop from './Pages/Shop';
import Cart from './Pages/Cart';
import Product from './Pages/Product';
import LoginSignup from './Pages/LoginSignup';
import UserProfile from './Components/UserProfile/UserProfile';
import { ShopContextProvider } from './Context/ShopContext';
import Navbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import ShopCategory from './Pages/ShopCategory';
import women_banner from './Components/Assets/women_banner.jpg';
import men_banner from './Components/Assets/men_banner.jpg';
import kid_banner from './Components/Assets/kids_banner.jpg';
import './App.css';

export const backend_url = 'http://localhost:4000';
export const currency = '$';

function App() {
  return (
    <div>
      <BrowserRouter>
        <ShopContextProvider>
          <Navbar />
          <Routes>
            <Route path='/' element={<Shop gender="all" />} />
            <Route path='/mens' element={<ShopCategory banner={men_banner} category="men" />} />
            <Route path='/womens' element={<ShopCategory banner={women_banner} category="women" />} />
            <Route path='/kids' element={<ShopCategory banner={kid_banner} category="kid" />} />
            <Route path='/product/:productId' element={<Product />} />
            <Route path='/cart' element={<Cart />} />
            <Route path='/login' element={<LoginSignup />} />
            <Route path='/profile' element={<UserProfile />} />
          </Routes>
          <Footer />
        </ShopContextProvider>
      </BrowserRouter>
    </div>
  );
}

export default App; 