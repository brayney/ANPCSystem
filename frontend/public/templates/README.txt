CSV TEMPLATE SETUP GUIDE
========================

How to use the ANPC Yard CSV templates properly:

1. DOWNLOAD THE TEMPLATE
   - Click the "Template" button on any equipment page
   - Save the CSV file to your computer

2. OPEN IN EXCEL (Windows/Mac)
   - Right-click the file → Open With → Excel
   - Or drag the file into Excel

3. AUTO-FIT COLUMNS (Most Important!)
   
   For Excel:
   - Select all cells: Press Ctrl+A (or Cmd+A on Mac)
   - Go to Home tab → Format → AutoFit Column Width
   - All column headers will now display fully without cutting
   
   For Google Sheets:
   - Upload the CSV file to Google Drive
   - Select all cells: Press Ctrl+A (or Cmd+A on Mac)
   - Go to Format → Column → Optimal width
   - Headers and data will fit perfectly

4. FILL IN YOUR DATA
   - Keep the header row (first row) as-is
   - Start entering your equipment data from row 2
   - Each row = 1 piece of equipment

5. REQUIRED FIELDS
   Equipment Type | Required Field(s)
   --------------|-------------------
   Cranes        | equipmentNo (Equipment ID)
   Counterweights| itemName (Equipment Name)
   Hooks         | itemName (Equipment Name)
   Boom Sections | itemName (Equipment Name)

6. FIELD DEFINITIONS

   CRANES TEMPLATE:
   - equipmentNo: Unique crane ID (e.g., CR-001)
   - craneModel: Model name (e.g., Liebherr LTM 1100)
   - yearModel: Year manufactured (e.g., 2018)
   - capacity: Lifting capacity (e.g., 100)
   - supervisor: Assigned supervisor name
   - client: Customer name (auto-filled, usually "-")
   - status: Equipment status (Available/Out of Yard/Under Maintenance/On Hire)

   COUNTERWEIGHTS TEMPLATE:
   - itemName: Name of counterweight block
   - serialNo: Serial number (e.g., CW-SN-001)
   - assignedCrane: Which crane it belongs to (e.g., CR-001)
   - weightKg: Weight in kilograms
   - capacity: Capacity rating in kilograms
   - location: Current location (auto-filled, usually "RAG YARD")
   - condition: OK / NOT OK / For Repair / Unknown
   - status: Available/Out of Yard/Under Maintenance
   - client: Customer name (auto-filled, usually "-")

   HOOKS TEMPLATE:
   - itemName: Name of hook block
   - hookSerialNo: Serial number
   - capacity: Lifting capacity in tons
   - assignedCrane: Which crane it belongs to
   - location: Current location (auto-filled)
   - status: Available/Out of Yard/Under Maintenance/Allocated
   - weightKg: Weight of the hook
   - condition: OK / NOT OK / For Repair / Unknown
   - client: Customer name (auto-filled, usually "-")

   BOOM SECTIONS TEMPLATE:
   - assignedCrane: Which crane (e.g., CR-001)
   - boomCode: Internal boom code
   - itemName: Description of boom section
   - length: Length in meters
   - weightKg: Weight in kilograms
   - location: Current location (auto-filled)
   - condition: Ok / NOT OK / For Repair / Unknown
   - status: Available/Out of Yard/Under Maintenance
   - client: Customer name (auto-filled, usually "-")

7. VALID STATUS VALUES
   - Available: Ready to use
   - Out of Yard: Currently in use/deployed
   - Under Maintenance: Being serviced
   - On Hire: Currently rented out
   - Allocated: Reserved for upcoming transaction

8. UPLOAD YOUR DATA
   - Once filled, click "Import CSV" button
   - Select your completed template file
   - System will validate and import all records
   - Success message shows how many items were added

9. ERROR HANDLING
   If import fails:
   - Check that required fields are filled
   - Verify no duplicate equipment IDs
   - Ensure status values are exactly as listed above
   - Check error message for specific row issues
   - Correct and try importing again

10. TIPS FOR SUCCESS
    - Fill in at least one complete row first to test
    - Use exact spacing and spelling for dropdowns (status, condition)
    - Serial numbers should be unique per item
    - Equipment IDs must be unique (no duplicates)
    - Leave blank cells empty (don't use "NA" or "None")
    - Auto-fit columns before reviewing data

Need help? Check individual field descriptions above or contact support.
