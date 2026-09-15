import PageHeader from '../components/layout/PageHeader';
import { useParams } from 'react-router-dom';
export default function BookingDetailsPage() {
  const { id } = useParams();
  return (
    <div>
      <PageHeader title={`Booking Details - ${id}`} />
      <div className="card">Booking details will be implemented here.</div>
    </div>
  );
}
