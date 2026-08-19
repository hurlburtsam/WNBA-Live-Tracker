import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LiveGamesPage from '/.routes/LiveGamesPage';
import BoxScore from './views/BoxScore';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path = "/" element = {<LiveGamesPage />} />
        <Route path = "/games/:gameId" element = {<BoxScore />} />
      </Routes>
    </BrowserRouter>
  );
}