# Blood Sync: Real-Time Blood Donation Coordination Platform

Blood Sync is a comprehensive web application designed to bridge the gap between blood donation camps and hospitals in need. It provides a real-time, map-based platform for NSS (National Service Scheme) coordinators to manage donation camps with detailed donor tracking, and for hospitals to request blood supplies efficiently based on proximity and availability.

🌐 **Live Demo**: [https://bloodsync.pages.dev/](https://bloodsync.pages.dev/)

## ✨ Core Features

- **Role-Based Access**: Separate, tailored dashboards for **Hospitals** and **NSS Coordinators**.
- **Live Map Dashboard**: Hospitals can view all active blood donation camps on an interactive map, showing their location relative to the camps.
- **Donor Management System**: Complete donor tracking with UUID generation, contact information, and donation history.
- **Real-Time Inventory**: NSS Coordinators manage a live inventory of available blood units (A+, A-, B+, B-, AB+, AB-, O+, O-) automatically updated from donor records.
- **Camp History**: View comprehensive summaries of past camps including total donations, donor counts, and blood type breakdowns.
- **Targeted Requests**: Hospitals can send blood requests directly to a specific camp based on proximity and available inventory.
- **Geolocation**: Camps are created using the coordinator's live GPS coordinates, ensuring accurate location data.
- **Instant Communication**: The platform is built on Firebase, allowing for real-time updates for requests, inventory changes, and donor records.

---

## 🚀 User Roles & Functionality

### 🏥 Hospital Dashboard

- **View Camps on Map**: See all active donation camps marked on a `react-leaflet` map. Your hospital's location is also marked for easy reference.
- **Camp Details**: Click on a camp to view its exact location, the name of the coordinator, and its current blood inventory.
- **Calculate Distance**: Automatically calculates and displays the distance from the hospital to each camp using the Haversine formula.
- **Send Blood Requests**: Select a camp and fill out a form to request a specific blood type and number of units. The system validates that the requested units don't exceed available inventory.
- **Track Requests**: Monitor the status of sent requests (Pending, Delivering, Delivered).
- **Delete Requests**: Remove your own requests if needed.

### 🏕️ NSS Coordinator Dashboard

#### Active Camp Management:
- **Start Camps**: Create a new donation camp session at your current location. The system automatically captures GPS coordinates and initializes inventory for all 8 standard blood types.
- **End Camps**: Close camp sessions. Camps are archived as "inactive" rather than deleted, preserving historical data.
- **Donor Registration**: Add new donors with automatically generated UUIDs, capturing:
  - Contact information (phone/email)
  - Blood type
  - Units donated
  - Timestamp
- **View Donors by Blood Type**: Click on any blood type to see all donors who contributed that type, with donor count badges.
- **Edit Donor Information**: Update donor contact details, blood type, or units. Inventory is automatically adjusted.
- **Delete Donor Records**: Remove donor entries with automatic inventory adjustment and confirmation prompts.
- **Real-Time Inventory**: Blood inventory updates automatically as donors are added, edited, or removed.
- **Manage Requests**: View incoming blood requests from hospitals and update their status (Pending → Delivering → Delivered).

#### Past Camps History:
- **Camp Summaries**: View all previously ended camps with:
  - Total units donated across all blood types
  - Total number of donors
  - Detailed blood type breakdown
  - Camp duration (start and end dates)
  - Location and coordinator information
- **Historical Analytics**: Track your donation camp performance over time.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend & Database**: Firebase (Firestore for database, Firebase Authentication)
- **Mapping**: `react-leaflet` v5.0 & `leaflet` v1.9.4
- **UI Components**: `lucide-react` for icons
- **Utilities**: `uuid` v4 for donor ID generation

---

## 📊 Firestore Collections

### `users`
- Stores user profile information and roles (HOSPITAL or NSS_COORDINATOR)

### `camps`
- Active and inactive blood donation camps
- Includes location (GPS coordinates), inventory, coordinator info, and status

### `requests`
- Blood requests from hospitals to specific camps
- Tracks blood type, units, urgency, status, and distance

### `donors`
- Individual donor records with UUID, contact info, blood type, units, and timestamps
- Linked to specific camps for historical tracking

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- `npm` or `yarn`

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd blood-sync-new
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

The `firebase.js` file is included in the project. You don't need to do any configurations.

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🧪 Test Accounts

You can use the following credentials to test the application:

- **NSS Coordinator**:
  - **Email**: `Sai200727@gmail.com`
  - **Password**: `Hello@123`

- **Hospital**:
  - **Email**: `stejas2706@gmail.com`
  - **Password**: `Hello@123`

---

## 📜 Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Creates a production-ready build of the application.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run preview`: Serves the production build locally for preview.

---

## 🌍 How It Works

### Coordinator Flow:
1. Login as coordinator
2. Click **"Start Camp"** button
3. Enter camp details (location name, coordinator name)
4. Browser requests permission for location access
5. Camp is created with current GPS coordinates and initialized inventory
6. Click **"Add Donor"** to register each donation:
   - System generates unique donor ID
   - Enter donor contact information
   - Select blood type
   - Enter units donated
   - Inventory automatically updates
7. View donors by clicking blood type badges
8. Edit or delete donor records as needed
9. View and respond to incoming blood requests from hospitals
10. Click **"End Camp"** when done - camp is archived with all donation data

### Hospital Flow:
1. Login as hospital
2. Browser requests permission for location access
3. View interactive map showing:
   - Your hospital location (blue marker)
   - All active camps nearby (red markers)
4. Click on a camp marker to view details
5. Review camp inventory and distance
6. Click **"Request Blood"**
7. Fill out request form:
   - Select blood type
   - Enter units needed
   - Mark as urgent if necessary
   - System validates units don't exceed camp inventory
8. Track request status updates (Pending → Delivering → Delivered)
9. Delete requests if needed

---

## 🗺️ Map Features

- **Interactive**: Pan, zoom, and click on markers
- **Real-time Updates**: Camps appear/disappear as they start/end
- **Distance Calculation**: Automatic using Haversine formula
- **Custom Icons**: Blue markers for hospitals, red markers for camps
- **Responsive Design**: Works on desktop and mobile

---

## 🔐 Permissions Required

- **Browser Geolocation**: Required for both coordinators and hospitals
  - Coordinators: To capture camp location
  - Hospitals: To calculate distances to camps and show hospital location

---

## 🔒 Firebase Security Rules

The project includes comprehensive Firestore security rules in `firestore.rules`:

- **Users**: Can read/update their own profile
- **Camps**: Authenticated users can read active camps; only coordinators can create/update their own camps
- **Requests**: Authenticated users can create and read requests; users can delete their own requests
- **Donors**: Authenticated users can read; only camp coordinators can create/edit/delete donor records for their camps

Deploy rules using: `firebase deploy --only firestore:rules`

---

## 🎨 UI Features

- Color-coded status badges for requests
- Distance indicators on map and request cards
- Urgent request highlighting
- Responsive grid layouts
- Modal dialogs for all major actions
- Real-time inventory updates
- Donor count badges
- Past camp summary cards with analytics
- Loading states and error handling

---

## 🆕 Recent Updates

- ✅ Complete donor management system with UUID generation
- ✅ Edit and delete donor functionality
- ✅ Real-time inventory updates based on donor records
- ✅ Past camps history with comprehensive analytics
- ✅ Camp archival system (inactive status instead of deletion)
- ✅ Donor filtering by blood type
- ✅ Enhanced Firebase security rules for donors collection
- ✅ Inventory validation on hospital requests

---

## 📱 Browser Compatibility

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

Geolocation API is required and must be enabled in browser settings.
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
