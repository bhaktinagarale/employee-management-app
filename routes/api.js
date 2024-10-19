const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const fs = require("fs");

// Load Google Sheets credentials
const credentials = JSON.parse(fs.readFileSync("credentials/credentials.json"));
const { client_email, private_key } = credentials;
const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

const auth = new google.auth.JWT(client_email, null, private_key, scopes);
const sheets = google.sheets({ version: "v4", auth });

const spreadsheetId = "1S1YyDtB4MwT7b26w5jN4rjyRvlW0vbAJoKD5D0nRQnI";

// GET all employees from the Google Sheet
router.get("/employees", async (req, res) => {
  try {
    const range = "Sheet1!A2:F"; // Adjust range if needed
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values;
    res.json(rows);
  } catch (err) {
    res.status(500).send("Error fetching employees data from Google Sheets");
  }
});

//GET all departments from the Goole Sheet
router.get("/departments", async (req, res) => {
  try {
    const range = "Sheet2!A2:B";
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values;
    res.json(rows);
  } catch (err) {
    res.status(500).send("Error fetching departments data from Google Sheets");
  }
});

// POST to add a new employee to Google Sheets
router.post("/employees", async (req, res) => {
  const { id, name, department, joiningDate, salary, email } = req.body;
  try {
    const values = [[id, name, department, joiningDate, salary, email]];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:F", // Adjust range if needed
      valueInputOption: "RAW",
      resource: { values },
    });
    res.status(201).send("Employee added");
  } catch (err) {
    res.status(500).send("Error adding employee");
  }
});

// PUT to update an employee's data in Google Sheets
router.put("/employees/:rowIndex", async (req, res) => {
  const { rowIndex } = req.params;
  const { id, name, department, joiningDate, salary, email } = req.body;
  try {
    const values = [[id, name, department, joiningDate, salary, email]];
    const range = `Sheet1!A${parseInt(rowIndex) + 2}:F${
      parseInt(rowIndex) + 2
    }`; // Add 2 to account for header row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      resource: { values },
    });
    res.send("Employee updated");
  } catch (err) {
    res.status(500).send("Error updating employee");
  }
});

// DELETE an employee from Google Sheets by clearing the row
router.delete("/employees/:rowIndex", async (req, res) => {
  const { rowIndex } = req.params;
  try {
    const request = {
      spreadsheetId,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: "ROWS",
                startIndex: parseInt(rowIndex) + 1,
                endIndex: parseInt(rowIndex) + 2,
              },
            },
          },
        ],
      },
    };

    // Send batchUpdate request to delete the row
    await sheets.spreadsheets.batchUpdate(request);

    res.send("Employee row deleted");
  } catch (err) {
    console.error("Error deleting employee row:", err);
    res.status(500).send("Error deleting employee row");
  }
});
module.exports = router;
