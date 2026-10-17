# MyFitness Mobile

A modern, cross-platform mobile application for managing fitness routines and exercises. Built with React Native and Expo, this app serves as the frontend client for the MyFitness microservices ecosystem.

## Features

*   **Authentication:** Secure login using Google Sign-In, integrated with our custom Spring Boot authentication service.
*   **Exercise Catalog:** Browse a public catalog of exercises or create your own private exercises.
*   **Routine Management:** Build custom workout routines by selecting exercises from the catalog. Support for public and private routines.
*   **Modern UI/UX:** Clean, dark-mode focused interface built with Tailwind CSS.
*   **Modular Architecture:** Highly reusable components (Modals, Selectors) strictly typed with TypeScript.

## Tech Stack

*   **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
*   **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
*   **Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
*   **HTTP Client:** [Axios](https://axios-http.com/) (Configured with JWT interceptors)
*   **Auth:** `@react-native-google-signin/google-signin` & SecureStore

## Project Structure

~~~text
myfitness-mobile/
├── src/
│   ├── api/                  # Axios clients and interceptors (axiosClient.ts)
│   ├── app/                  # Expo Router screens
│   │   ├── (auth)/           # Authentication screens (Login)
│   │   └── (tabs)/           # Main navigation tabs (Routines, Exercises)
│   ├── features/             # Feature-based modules
│   │   └── workouts/
│   │       └── components/   # Reusable UI pieces (CreateRoutineModal, etc.)
│   └── types/                # Global TypeScript definitions
├── assets/                   # Images, icons, and fonts
├── app.json                  # Expo configuration
├── tailwind.config.js        # NativeWind/Tailwind configuration
└── tsconfig.json             # TypeScript configuration
~~~

## Prerequisites

Before you begin, ensure you have met the following requirements:
*   [Node.js](https://nodejs.org/) (v18 or newer recommended)
*   [Expo CLI](https://docs.expo.dev/get-started/installation/)
*   An Android Emulator, iOS Simulator, or the Expo Go app on your physical device.
*   The **MyFitness Backend Microservices** (Gateway, Auth, Catalog, Workout) running locally or remotely.

## Installation & Setup

1. **Clone the repository** (if applicable):
   ~~~bash
   git clone [https://github.com/yourusername/myfitness-mobile.git](https://github.com/yourusername/myfitness-mobile.git)
   cd myfitness-mobile
   ~~~

2. **Install dependencies:**
   ~~~bash
   npm install
   ~~~

3. **Environment Variables:**
   Create a `.env` file in the root directory and configure your backend URL and Google Client ID:
   ~~~env
   EXPO_PUBLIC_API_URL=http://your-api-gateway-ip:8080/api/v1
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ~~~

4. **Start the development server:**
   ~~~bash
   npx expo start --clear
   ~~~

## Roadmap / Next Steps

- [x] Google Authentication
- [x] CRUD for Exercises
- [x] CRUD for Routines
- [ ] **Training System:** Add target sets, reps, and rest times to workout templates.
- [ ] **Active Workout Tracker:** Real-time tracking of ongoing sessions.
- [ ] **Analytics:** Progress charts and workout history.

## License

This project is open-source and available under the [MIT License](LICENSE).
