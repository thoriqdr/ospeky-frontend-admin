import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import axios from 'axios';


// PENTING: Baris ini memuat seluruh styling yang telah kita buat
import './App.css'

axios.defaults.baseURL = 'http://localhost:5000';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)