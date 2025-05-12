# graphql

This project is a web application that allows users to log in and view their profile information from the GraphQL API. The profile includes personal information, XP progress, audit statistics, and graphical visualizations.

## Features

- User authentication with JWT
- Profile display with three main sections:
  - Basic Information
  - XP and Progress
  - Audit Information
- Graphical statistics section with SVG graphs:
  - XP Progress over time (Bar Chart)
  - Audit Distribution (Pie Chart)
- Responsive design

## How to Run

1. Clone this repository
2. Open the project folder in your terminal
3. Start a local server:

Using Python:
```
python -m http.server
```

Or using Node.js:
```
npx serve
```

4. Open your browser and navigate to `http://localhost:8000/public/login.html`
5. Log in with your credentials

## Project Structure

```
graphql/
├── public/
│   ├── index.html         # Main application page
│   ├── login.html         # Login page
│   ├── styles.css         # Styles for the application
├── src/
│   ├── api/
│   │   ├── graphql.js     # Functions for sending GraphQL queries
│   │   ├── auth.js        # Functions for login, logout, manage JWT
│   ├── components/
│   │   ├── profile.js     # Code to fetch and display user profile
│   │   ├── stats.js       # Code to fetch data and draw SVG graphs
│   │   ├── ui.js          # Small UI helpers (show errors, show/hide sections)
│   ├── utils/
│   │   ├── svg.js         # SVG generation helpers
│   ├── app.js             # Entry point, handles routing between login/profile
├── README.md              # This file
```

## Technologies Used

- Vanilla JavaScript (ES6+)
- GraphQL for data fetching
- SVG for data visualization
- CSS for styling
- JWT for authentication

## Notes

- This application uses the GraphQL API at `https://01.gritlab.ax/api/graphql-engine/v1/graphql`
- Authentication is handled through JWT tokens stored in localStorage