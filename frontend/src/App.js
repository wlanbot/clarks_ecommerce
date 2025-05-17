import Navbar from "./Components/Navbar/Navbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Shop from "./Pages/Shop";
import Cart from "./Pages/Cart";
import Product from "./Pages/Product";
import Footer from "./Components/Footer/Footer";
import ShopCategory from "./Pages/ShopCategory";
import women_banner from "./Components/Assets/women_banner.jpg";
import men_banner from "./Components/Assets/men_banner.jpg";
import kid_banner from "./Components/Assets/kids_banner.jpg";
import LoginSignup from "./Pages/LoginSignup";
import AdminPanel from "./Components/Admin/AdminPanel";
import EditProduct from "./Components/Admin/EditProduct";
import AddProduct from "./Components/Admin/AddProduct";
import EditUser from "./Components/Admin/EditUser";
import UpdateProducts from './Components/Admin/UpdateProducts';
import UserProfile from './Components/UserProfile/UserProfile';
import Checkout from './Pages/Checkout';
import AddressManagement from './Pages/AddressManagement';
import OrderHistory from './Pages/OrderHistory';
import PaymentSuccess from './Pages/PaymentSuccess';
import PaymentFailure from './Pages/PaymentFailure';
import ShopContextProvider from "./Context/ShopContext";

export const backend_url = "http://localhost:4000"
export const currency = "$"

function App() {
  return (
    <div>
      <Router>
        <ShopContextProvider>
          <Navbar />
          <Routes>
            {/* Rutas principales */}
            <Route path="/" element={<Shop gender="all" />} />
            <Route path="/mens" element={<ShopCategory banner={men_banner} category="men" />} />
            <Route path="/womens" element={<ShopCategory banner={women_banner} category="women" />} />
            <Route path="/kids" element={<ShopCategory banner={kid_banner} category="kid" />} />
            <Route path="/product/:productId" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<LoginSignup />} />
            <Route path="/profile" element={<UserProfile />} />

            {/* Rutas de checkout y pedidos */}
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/addresses" element={<AddressManagement />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failure" element={<PaymentFailure />} />

            {/* Rutas de administración */}
            <Route path="/admin" element={<AdminPanel />}>
              <Route path="products" element={<EditProduct />} />
              <Route path="addproduct" element={<AddProduct />} />
              <Route path="users" element={<EditUser />} />
              <Route path="updateproducts" element={<UpdateProducts />} />
            </Route>
          </Routes>
          <Footer />
        </ShopContextProvider>
      </Router>
    </div>
  )
}

export default App
