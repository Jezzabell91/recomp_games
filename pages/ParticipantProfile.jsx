import { useParams } from 'react-router-dom';
import Stub from '../components/Stub';
export default function ParticipantProfile() {
  const { userId } = useParams();
  return <Stub title="Participant Profile" phase={3} subtitle={`userId: ${userId}`} />;
}
