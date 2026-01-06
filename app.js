// 1. Import modules using CommonJS 'require()' syntax (default for Node.js)
const express = require('express');
const path = require('path');
// __dirname is automatically available when using require() syntax.

// 2. Create an instance of the Express application
const app = express();
// 3. Define the port the server will run on
const PORT = process.env.PORT || 3000;

// 4. Define a route handler for the default home page
app.get('/', (req, res) => {
    // Use path.join to create the absolute path to your HTML file.
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 5. Start the server and listen on the defined port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});