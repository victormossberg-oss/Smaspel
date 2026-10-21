
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Latspelet from "./pages/Latspelet";
import Ordspelet from "./pages/Ordspelet";

export default function App() {
  return (
    <div className="min-h-screen bg-[#111111]">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/latspelet" element={<Latspelet />} />
        <Route path="/ordspelet" element={<Ordspelet />} />
      </Routes>
    </div>
  );
}
