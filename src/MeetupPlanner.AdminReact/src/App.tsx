import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import MeetupsList from './pages/meetups/MeetupsList';
import AddMeetup from './pages/meetups/AddMeetup';
import EditMeetup from './pages/meetups/EditMeetup';
import SpeakersList from './pages/speakers/SpeakersList';
import AddSpeaker from './pages/speakers/AddSpeaker';
import EditSpeaker from './pages/speakers/EditSpeaker';
import PresentationsList from './pages/presentations/PresentationsList';
import AddPresentation from './pages/presentations/AddPresentation';
import EditPresentation from './pages/presentations/EditPresentation';
import LocationsList from './pages/locations/LocationsList';
import AddLocation from './pages/locations/AddLocation';
import EditLocation from './pages/locations/EditLocation';
import NotFound from './pages/NotFound';
import User from './pages/User';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          
          {/* Meetups */}
          <Route path="meetups" element={<MeetupsList />} />
          <Route path="meetups/add" element={<AddMeetup />} />
          <Route path="meetups/:meetupId" element={<EditMeetup />} />
          
          {/* Speakers */}
          <Route path="speakers" element={<SpeakersList />} />
          <Route path="speakers/add" element={<AddSpeaker />} />
          <Route path="speakers/:speakerId" element={<EditSpeaker />} />
          
          {/* Presentations */}
          <Route path="presentations" element={<PresentationsList />} />
          <Route path="presentations/add" element={<AddPresentation />} />
          <Route path="presentations/:presentationId" element={<EditPresentation />} />
          
          {/* Locations */}
          <Route path="locations" element={<LocationsList />} />
          <Route path="locations/add" element={<AddLocation />} />
          <Route path="locations/:locationId" element={<EditLocation />} />
          
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="user" element={<User />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
