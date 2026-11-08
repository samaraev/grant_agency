import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export function useBuildingList({ limit = 60, includeDrafts = false } = {}) {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const query = includeDrafts ? {} : { is_published: true };
    base44.entities.Building.filter(query, { sort: '-updated_at', limit })
      .then((page) => {
        if (alive) setBuildings(page?.items || []);
      })
      .catch(() => {
        if (alive) setBuildings([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [limit, includeDrafts]);

  return { buildings, loading };
}

export function useBuilding(id) {
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    base44.entities.Building.get(id)
      .then((record) => {
        if (alive) setBuilding(record || null);
      })
      .catch(() => {
        if (alive) setBuilding(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return { building, loading };
}

export default useBuildingList;