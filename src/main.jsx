// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ReviewModal from './pages/ReviewWrite/ReviewModal.jsx'

function PreviewRoot() {
  // 처음 진입 시 바로 모달 열어보기
  const [open, setOpen] = useState(true)

  return (
    <>
      <App />
      {open && <ReviewModal onClose={() => setOpen(false)} />}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PreviewRoot />
  </StrictMode>,
)
