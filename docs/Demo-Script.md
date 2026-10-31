🎤 DB-Surgeon: 4:00 PM Demo Script

Judges have a short attention span. Do not explain the code first. Show the magic, then explain how it works.

Step 1: The "Garbage Data" Hook (0:00 - 0:30)

Action: Open the React UI. Show the judges a messy, unstructured database table (e.g., repeating addresses, unformatted phone numbers, exposed Aadhar numbers).

Script: "Companies spend thousands on data engineers to fix messy databases. Standard AI can't help because you can't expose production databases to ChatGPT. We built DB-Surgeon: an AI that securely executes on the infrastructure."

Step 2: The Core Execution (0:30 - 1:30)

Action: Type command: "Normalize this database, separate the users, and mask the PII." Click Execute.

Script: "Watch the terminal. The AI isn't just writing text. Our FastAPI backend is running a closed loop. It tries the SQL, hits a syntax error, catches the stack trace, and fixes itself."

Visual: The UI updates instantly with a beautiful, relational 3rd Normal Form schema graph.

Step 3: The Edge Fallback Flex (1:30 - 2:00)

Action: Disconnect the i3 laptop from the Wi-Fi. Run another database command (e.g., "Generate 50 rows of dummy Goan user data").

Script: "We just killed the internet. But enterprise tools can't fail. Our FastAPI router instantly detected the drop and rerouted the reasoning to our local Edge Node running Gemma 4 on the gaming laptop."

Visual: The UI badge changes from 🟢 Cloud API to 🟠 Local Edge, and the data still populates.

Step 4: The Time-Travel Safety Net (2:00 - 2:30)

Action: Click the red "Undo Mutation" button. The database instantly reverts to the messy state.

Script: "Because AI can be destructive, we built a physical state-manager using Python shutil. If the AI drops a table, one click restores the exact file state."