// netlify/functions/get-setting.js
const { db } = require('../utils/database');
const { verifyAdminToken } = require('../utils/auth'); // Admin needs to be logged in to view settings

exports.handler = async function(event, context) {
  // Handle preflight CORS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Adjust in production if needed
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  // Ensure it's a GET request
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405, // Method Not Allowed
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // --- Authentication: Check if an admin is logged in ---
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401, // Unauthorized
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Unauthorized: Missing or invalid token format' })
    };
  }

  const decoded = verifyAdminToken(authHeader);
  if (!decoded) {
    return {
      statusCode: 401, // Unauthorized
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid or expired token' })
    };
  }
  // No specific permission check needed here; any logged-in staff can view settings.

  // --- Get the 'key' parameter from the URL ---
  const { key } = event.queryStringParameters;

  // Validate that the 'key' parameter was provided
  if (!key) {
    return {
      statusCode: 400, // Bad Request
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Parameter "key" is required' })
    };
  }

  console.log(`Attempting to fetch setting with key: ${key}`);

  // --- Fetch the setting from the database ---
  try {
    const result = await db.query(
      'SELECT value, last_updated, last_updated_by FROM settings WHERE key = $1',
      [key]
    );

    // Check if a setting with that key was found
    if (result.rows.length === 0) {
      console.warn(`Setting with key "${key}" not found in database.`);
      return {
        statusCode: 404, // Not Found
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Setting with key "${key}" not found` })
      };
    }

    console.log(`Successfully fetched setting for key: ${key}`);

    // Return the found setting value and metadata
    return {
      statusCode: 200, // OK
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      // Send back an object like { value: "...", last_updated: "...", last_updated_by: "..." }
      body: JSON.stringify(result.rows[0])
    };

  } catch (error) {
    console.error(`Database error fetching setting "${key}":`, error);
    return {
      statusCode: 500, // Internal Server Error
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Failed to fetch setting due to a server error',
        details: error.message // Include details for debugging
      })
    };
  }
};