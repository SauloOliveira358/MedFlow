import { useEffect, useState } from 'react';
import { useDemo } from '../context/DemoContext';
export function useRemoteAgenda(doctorId, dates) {
  const { remote, refreshAgenda } = useDemo();
  const [state, setState] = useState({ loading: remote, error: '' });
  const key = dates.filter(Boolean).join(',');
  useEffect(() => {
    if (!remote || !doctorId || !key) return;
    let alive = true;
    let running = false;
    setState({ loading: true, error: '' });
    const refresh = async () => {
      if (running) return;
      running = true;
      try {
        await refreshAgenda(doctorId, key.split(','));
        if (alive) setState({ loading: false, error: '' });
      } catch (e) { if (alive) setState({ loading: false, error: e.message }); }
      finally { running = false; }
    };
    refresh();
    const timer = setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { alive = false; clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [remote, doctorId, key, refreshAgenda]);
  return state;
}
