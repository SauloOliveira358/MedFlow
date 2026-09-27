import { Navigate, useLocation } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';

export default function RequerConta({ area, children }) {
  const { account } = useDemo();
  const location = useLocation();
  if (!account)
    return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
  if (account.role !== area) return <Navigate to={`/${account.role}`} replace />;
  return children;
}
export { RequerConta as RequireAccount };
