import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LiveGamesPage from './routes/LiveGamesPage';
import BoxScore from './views/BoxScore';
import Sidebar from './components/Sidebar';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1 , display: 'flex', justifyContent: 'center', marginRight: 200}}>
          <Routes>
            <Route path="/" element={<LiveGamesPage />} />
            <Route path="/games/:gameId" element={<BoxScore />} />
        </Routes>
        </div>
      </div>
    </BrowserRouter>
  ); 
}