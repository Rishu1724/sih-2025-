# Troubleshooting Guide for "ReferenceError: Property 'createAthlete' doesn't exist"

## Common Solutions

### 1. Clear Cache and Restart
Sometimes the React Native bundler caches old versions of files. To clear the cache:

1. Close the Expo development server (Ctrl+C in the terminal)
2. Delete the `.expo` folder in your project directory
3. Run the following command in your project directory:
   ```
   npx expo start --clear
   ```

### 2. Check File Imports
Verify that the import statement in `src/screens/athletes/AthleteRegistrationScreen.js` is correct:
```javascript
import { createAthlete } from '../../services/FirebaseService';
```

### 3. Verify FirebaseService Exports
Make sure the `src/services/FirebaseService.js` file properly exports the [createAthlete](file:///c:/Users/rishu/OneDrive/Desktop/New%20folder/SAI-Sports-Talent-Assessment/src/services/FirebaseService.js#L23-L35) function:
```javascript
export const createAthlete = async (athleteData) => {
  // function implementation
};

// And at the end of the file:
export default {
  createAthlete,
  // other exports
};
```

### 4. Check for Typos
Ensure there are no typos in:
- Function names
- Import statements
- File paths

### 5. Restart Development Server
If the above steps don't work:
1. Completely close the Expo development server
2. Close any running Node.js processes
3. Restart the development server with:
   ```
   npx expo start
   ```

### 6. Windows-Specific Solution
On Windows, if you're having issues with terminal commands:
1. Open a new PowerShell window
2. Navigate to your project directory:
   ```
   cd "c:\Users\rishu\OneDrive\Desktop\New folder\SAI-Sports-Talent-Assessment"
   ```
3. Run the clear command:
   ```
   npx expo start --clear
   ```

## If the Error Persists

### 1. Check Console Logs
Look for detailed error messages in the console that might provide more context about what's going wrong.

### 2. Add Debugging Logs
Add console.log statements to verify the function is being imported correctly:
```javascript
import { createAthlete } from '../../services/FirebaseService';

console.log('createAthlete type:', typeof createAthlete);
```

### 3. Verify Firebase Configuration
Check that `src/config/firebase.js` is properly configured and that Firebase is initializing correctly.

### 4. Check Package Versions
Ensure all dependencies are properly installed:
```
npm install
```

## Manual Cache Clearing

If the `--clear` flag doesn't work:

1. Delete the following folders if they exist:
   - `node_modules/.cache`
   - `.expo`
   - `__generated__`

2. Run:
   ```
   npm start -- --reset-cache
   ```

## Contact for Further Assistance

If none of these solutions work, please provide:
1. The exact error message
2. When the error occurs (during app startup, when registering an athlete, etc.)
3. Any recent changes made to the codebase
4. Screenshots of the error if possible