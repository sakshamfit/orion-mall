import React from 'react';
import { createRoot } from 'react-dom/client';
import DoodleCrewFooter from '../components/ui/doodle-crew-footer';
import './footer.css';
const element = document.getElementById('orion-footer-root');
if (element) createRoot(element).render(<DoodleCrewFooter />);
