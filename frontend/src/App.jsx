import { useState } from 'react';
import SearchPanel from './SearchPanel.jsx';
import CodesPanel from './CodesPanel.jsx';

export default function App() {
  const [tab, setTab] = useState('search');

  return (
    <div>
      <h1>Discount Finder</h1>
      <p className="subtitle">Compare prices across retailers and find active discount codes.</p>

      <div className="tabs">
        <button className={`tab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>
          Price compare
        </button>
        <button className={`tab ${tab === 'codes' ? 'active' : ''}`} onClick={() => setTab('codes')}>
          Discount codes
        </button>
      </div>

      {tab === 'search' ? <SearchPanel /> : <CodesPanel />}
    </div>
  );
}
