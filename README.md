# Blood Sync - Location-Based Blood Donation System

## 🎯 Recent Major Updates

This application has been drastically updated to support **location-based blood donation camps** with real-time map visualization and targeted requests.

## 🚀 New Features

### For NSS Coordinators:
- **Start Camp Sessions**: Create a new blood donation camp at any location
  - System automatically captures GPS coordinates
  - Enter camp location name and coordinator name
  - Initialize blood inventory for the camp
- **Manage Camp Inventory**: Add/remove blood units in real-time as donations come in
- **View Targeted Requests**: See only requests sent to your specific camp
- **End Camp Sessions**: Close the camp when done (removes it from the system)

### For Hospitals:
- **Interactive Map View**: See all active donation camps on a map
  - View your hospital location (blue marker)
  - View all active camps (red markers)
  - See distance to each camp
- **Camp Details**: Click on any camp to see:
  - Available blood inventory
  - Coordinator name
  - Distance from your location
  - GPS coordinates
- **Targeted Requests**: Send blood requests to specific camps
  - Select a camp from map or list view
  - Specify blood type, units, and urgency
  - Distance is automatically calculated and saved
- **Request Tracking**: Track all your requests with status updates

## 📦 New Dependencies

```json
{
  "react-leaflet": "^latest",
  "leaflet": "^latest"
}
```

## 🗄️ Firestore Structure Changes

### New Collections:

#### `camps`
Stores active blood donation camp sessions:
- Location (name and GPS coordinates)
- Coordinator information
- Blood inventory per camp
- Status (active/ended)

#### `requests` (Updated)
Now includes:
- `camp_id`: Links request to specific camp
- `camp_location`: Camp name for display
- `distance`: Distance in km from hospital to camp

📖 See `FIRESTORE_STRUCTURE.md` for complete documentation.

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
Ensure your `firebase.js` is configured with your Firebase project credentials.

### 3. Set Up Firestore Security Rules
Apply the recommended security rules from `FIRESTORE_STRUCTURE.md`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /camps/{campId} {
      allow read: if resource.data.status == 'active';
      allow create: if request.auth != null
        && request.resource.data.coordinator_uid == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.coordinator_uid == request.auth.uid;
    }

    match /requests/{requestId} {
      allow read, create, update: if request.auth != null;
    }
  }
}
```

### 4. Enable Geolocation
Make sure your app is served over HTTPS in production (required for browser geolocation API).

For local development, browsers allow geolocation on `localhost`.

### 5. Run the Development Server
```bash
npm run dev
```

## 🌍 How It Works

### Coordinator Flow:
1. Login as coordinator
2. Click **"Start Camp"** button
3. Enter camp details (location name, coordinator name)
4. Browser requests permission for location access
5. Camp is created with current GPS coordinates
6. Manage blood inventory using +/- buttons
7. View and respond to incoming requests
8. Click **"End Camp"** when done

### Hospital Flow:
1. Login as hospital
2. Browser requests permission for location access
3. View interactive map showing:
   - Your hospital location
   - All active camps nearby
4. Click on a camp marker or select from list
5. Review camp details (inventory, distance)
6. Click **"Request Blood"**
7. Fill out request form (blood type, units, urgency)
8. Track request status in sidebar

## 🗺️ Map Features

- **Interactive**: Pan, zoom, and click on markers
- **Real-time Updates**: Camps appear/disappear as they start/end
- **Distance Calculation**: Automatic using Haversine formula
- **Responsive Design**: Works on desktop and mobile

## 🔐 Permissions Required

- **Browser Geolocation**: Required for both coordinators and hospitals
  - Coordinators: To capture camp location
  - Hospitals: To calculate distances to camps

## 🎨 UI Improvements

- Color-coded status badges
- Distance indicators
- Urgent request highlighting
- Responsive grid layouts
- Modal dialogs for actions
- Real-time inventory updates

## 🐛 Troubleshooting

### Map not displaying:
- Check browser console for errors
- Ensure leaflet CSS is imported
- Verify internet connection (map tiles load from OpenStreetMap)

### Location not working:
- Grant browser permission for location access
- Ensure HTTPS in production
- Check if location services are enabled on device

### Requests not showing:
- Verify camp is active (status: "active")
- Check that request has correct `camp_id`
- Ensure Firestore listeners are set up correctly

## 📱 Browser Support

- Chrome 50+ ✅
- Firefox 45+ ✅
- Safari 10+ ✅
- Edge 14+ ✅

Geolocation API is supported in all modern browsers.

## 🚀 Deployment

When deploying to production:

1. **HTTPS Required**: Geolocation API requires secure context
2. **Environment Variables**: Configure Firebase credentials
3. **Map Tiles**: OpenStreetMap tiles load from CDN (ensure not blocked)
4. **Firestore Indexes**: May need to create composite indexes based on queries

## 📊 Performance Notes

- Real-time listeners are used for camps and requests
- Distance calculations happen client-side
- Map renders all active camps (consider clustering for 50+ camps)
- Inventory updates are immediate via Firestore listeners

## 🔮 Future Enhancements

- [ ] Camp history and analytics
- [ ] Route optimization for deliveries
- [ ] Push notifications for request updates
- [ ] Volunteer management per camp
- [ ] Appointment scheduling for donors
- [ ] Export reports (CSV, PDF)
- [ ] Multi-language support
- [ ] Dark mode

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Team Information]

---

**Need Help?** Check `FIRESTORE_STRUCTURE.md` for database documentation or reach out to the development team.
