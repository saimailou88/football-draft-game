import PlayerCard from './components/PlayerCard';
import playersData from './data/players.json';
import './App.css';

function App() {
  const samplePlayer = playersData[0];

  return (
    <div className="App">
      <PlayerCard player={samplePlayer} />
    </div>
  );
}

export default App;
