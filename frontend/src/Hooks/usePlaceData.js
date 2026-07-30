import { useEffect, useState } from 'react';
import { buildApiUrl } from './config';

export default function usePlaceData(stateId, fetchAll = false) {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    const url = fetchAll
      ? buildApiUrl('/places/all')
      : stateId
      ? buildApiUrl(`/places/place/${stateId}`)
      : null;

    if (!url) return;

    fetch(url)
      .then(res => res.json())
      .then(data => setPlaces(Array.isArray(data) ? data : [data]))
      .catch(err => console.error('Error fetching places:', err));
  }, [stateId, fetchAll]);

  return places;
}
