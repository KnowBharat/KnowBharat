import { useEffect, useState } from 'react';
import { API_BASE_URL } from './config'; 

export default function useCategoryData(category, stateId, fetchAll = false) {
  const [data, setData] = useState(fetchAll ? [] : null);

  useEffect(() => {
    const singular = category.slice(0, -1); 
    const url = fetchAll
      ? `${API_BASE_URL}/${category}/all`
      : stateId ? `${API_BASE_URL}/${category}/${singular}/${stateId}` : null;

    if (!url) return;

    fetch(url)
      .then(res => res.json())
      .then(json => setData(Array.isArray(json) ? json : [json]))
      .catch(err => console.error(`Error fetching ${category}:`, err));
  }, [category, stateId, fetchAll]);

  return data;
}