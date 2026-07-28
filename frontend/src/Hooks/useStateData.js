import { useEffect, useState } from 'react';
import { API_BASE_URL } from './config';
const BASE = `${API_BASE_URL}/states`;
export default function useStateData() {
  const [stateData, setStateData] = useState({});
  const [selectedState, setSelectedState] = useState(null);
  const [stateIdMap, setStateIdMap] = useState({});
  useEffect(() => {
    fetch(`${BASE}/all`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const formatted = {};
        const idMap = {};
        data.forEach(state => {
          const key = normalizeStateName(state.name);
          formatted[key] = state;
          idMap[state.id] = state.name;
        });
        setStateData(formatted);
        setStateIdMap(idMap);
        if (Object.keys(formatted).length > 0) {
          setSelectedState(Object.keys(formatted)[35]);
        }
      })
      .catch(err => console.error('Error fetching states:', err));
  }, []);

  return { stateData, stateIdMap, selectedState, setSelectedState };
}

 function normalizeStateName(name) {
  return name.replace(/\s+/g, '').replace(/&/g, 'and').toLowerCase();
}