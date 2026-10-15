import {Routes,Route} from "react-router-dom";
import Header from "./Components/Admin/HeaderAdmin";
import Home from "./Components/Admin/HomeAdmin";
import AdminShop from "./Components/Admin/AdminShop";
import About from "./Components/Admin/AboutAdmin";
import AdminOrders from "./Components/Admin/AdminOrders";
import AdminReturnRequests from "./Components/Admin/AdminReturnRequests";
import './Admin.css'
export default function Admin() {
  return (
    <>
      <Header/>
      <Routes>
        <Route path="" element={<Home/>}/>
        <Route path="shop" element={<AdminShop/>}/>
        <Route path="about" element={<About/>}/>
        <Route path="orders" element={<AdminOrders />} />
        <Route path="return" element={<AdminReturnRequests/>}/>
      </Routes>
    </>
    
  );
}