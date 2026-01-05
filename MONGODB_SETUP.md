# MongoDB Atlas Setup (Free Tier)

## Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with your email or Google account
3. Complete the registration process

## Step 2: Create a Cluster
1. Click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select your preferred cloud provider and region
4. Name your cluster (e.g., "ProductivityApp")
5. Click "Create Cluster"

## Step 3: Create Database User
1. In the Security > Database Access section
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username (e.g., `productivityapp`)
5. Set a strong password (save this!)
6. Database User Privileges: "Atlas admin" for development
7. Click "Add User"

## Step 4: Network Access
1. Go to Security > Network Access
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add specific IP addresses
5. Click "Confirm"

## Step 5: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Driver: Node.js, Version: 5.5 or later
4. Copy the connection string

It will look like:
```
mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Step 6: Update Backend .env
1. Replace `<password>` with your actual password
2. Add database name after `.net/`:
```
MONGODB_URI=mongodb+srv://productivityapp:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ai-productivity-app?retryWrites=true&w=majority
```

## Troubleshooting

### Can't connect?
- Check if your IP is whitelisted
- Verify username and password
- Ensure network access is configured

### Cluster taking time?
- New clusters can take 5-10 minutes to provision
- Wait and refresh the page

## Collections Created Automatically
Once your app runs, it will create:
- `users` - User accounts
- `notes` - User notes with AI data
- `tasks` - User tasks with AI data

You can view these in the Atlas "Collections" tab after creating some data.
