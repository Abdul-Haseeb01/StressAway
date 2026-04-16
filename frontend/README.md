# StressAway Frontend

Modern, responsive frontend for the StressAway mental wellness platform built with Next.js 14, Redux, and Tailwind CSS.

## Features

- 🎨 Beautiful, calming UI with responsive design
- 📱 Mobile-first approach - works on all devices
- 🔐 Secure authentication with JWT
- 📊 Interactive stress analytics with Chart.js
- 😊 Facial emotion recognition (TensorFlow.js)
- 💬 AI-powered chatbot support
- 🧘 Wellness activities and mood tracking
- 👥 Social connections management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + react-chartjs-2
- **AI/ML**: TensorFlow.js
- **HTTP Client**: Axios
- **Camera**: react-webcam

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:3001

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── dashboard/         # Dashboard with charts
│   │   ├── questionnaire/     # Stress questionnaire
│   │   ├── facial-emotion/    # Facial emotion recognition
│   │   ├── chatbot/           # AI chatbot interface
│   │   ├── wellness/          # Wellness activities
│   │   ├── connections/       # Social connections
│   │   └── sos/               # Emergency SOS
│   ├── components/            # Reusable React components
│   ├── store/                 # Redux store and slices
│   │   ├── store.ts          # Store configuration
│   │   └── slices/           # Redux slices
│   └── utils/                 # Utility functions
│       ├── api.ts            # Axios instance
│       └── auth.ts           # Auth helpers
├── public/                    # Static assets
├── tailwind.config.js        # Tailwind configuration
└── next.config.js            # Next.js configuration
```

## Available Pages

- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Main dashboard with analytics
- `/questionnaire` - Stress assessment questionnaire
- `/facial-emotion` - Facial emotion recognition
- `/chatbot` - AI chatbot support
- `/wellness` - Wellness activities and mood tracking
- `/connections` - Manage connections with psychologists/family
- `/sos` - Emergency SOS system

## Key Features

### Responsive Design

The application is fully responsive and optimized for:
- Mobile phones (320px+)
- Tablets (768px+)
- Laptops (1024px+)
- Desktops (1280px+)

### State Management

Redux Toolkit is used for global state management with the following slices:
- `auth` - User authentication and session
- `questionnaire` - Questionnaire questions and responses
- `facialEmotion` - Facial emotion detection state
- `chat` - Chatbot messages

### API Integration

All API calls go through the centralized Axios instance (`utils/api.ts`) which:
- Automatically adds JWT tokens to requests
- Handles 401 unauthorized responses
- Provides consistent error handling

### Styling

Tailwind CSS with custom configuration:
- Calming color palette (blues, purples, greens)
- Custom animations and transitions
- Reusable component classes
- Mobile-first breakpoints

## Building for Production

```bash
npm run build
npm start
```

## Development Tips

1. **Hot Reload**: Changes are automatically reflected in the browser
2. **TypeScript**: Use TypeScript for type safety
3. **Redux DevTools**: Install Redux DevTools browser extension for debugging
4. **Responsive Testing**: Use browser DevTools to test different screen sizes

## Accessibility

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- High contrast color ratios
- Screen reader friendly

## Performance

- Code splitting with Next.js App Router
- Image optimization
- Lazy loading of components
- Optimized bundle size

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

**API Connection Issues:**
- Ensure backend is running on http://localhost:3001
- Check CORS configuration in backend
- Verify environment variables in `.env.local`

**TensorFlow.js Issues:**
- Clear browser cache
- Ensure model files are in `public/tfjs_model/`
- Check browser console for errors

**Redux State Issues:**
- Use Redux DevTools to inspect state
- Check action dispatches
- Verify reducer logic

## License

This project is for educational and mental wellness purposes.
