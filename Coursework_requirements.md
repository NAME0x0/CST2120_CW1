# CST2120 - Coursework 1

This plan is designed to help you achieve the maximum score of 100/100 on the CST2120 Coursework 1. The document does not define "Grade 1," so this guide equates it to a perfect score.

## **Missing Information**

- The term **'Grade 1' is not defined** in the coursework document. This plan assumes 'Grade 1' is equivalent to achieving the maximum score of 100/100.

-----

### **1. Executive Summary for Achieving Maximum Marks (100/100)**

To achieve a top score, you must deliver a project that demonstrates excellence and comprehensive completion of all rubric items. This involves creating a technically sophisticated game with polished graphics and unique functionality, not copied from the internet. You must also implement a full user account system—including registration, login, and validation—and a persistent high-score ranking table, using **only HTML local storage in JSON format**. Code quality is critical; it must be modular, well-commented, and flawlessly organized. Finally, you must submit a professionally formatted report and a concise, 5-minute video that clearly and methodically demonstrates every single feature outlined in the assessment criteria.

-----

### **2. Mapped Rubric Table**

| Rubric Criterion (Quoted from PDF) | Marks | Concrete Work Items | Examples to Showcase in Video/Report |
| :--- | :--- | :--- | :--- |
| **Website & Usability** |  |  |  |
| "Navigation bar and pages for the game, registration, login and rankings"  | 10 | Create separate pages/views for each function. Implement a persistent navigation bar. Ensure all links work correctly and navigation is possible without using the browser's back button. | Click through every item on the navigation bar. Show the game, registration, login, and rankings pages. |
| "Attractiveness. Are the pages well designed...Do all pages have the same style?"  | 10 | Design a consistent and visually appealing theme (colors, fonts, layout) using CSS. Apply this theme across all pages. Ensure the layout is responsive and clean. Avoid using default `alert()` pop-ups. | Show each page, highlighting the consistent header, footer, and color scheme. Demonstrate custom modal dialogs for messages instead of alerts. |
| "Usability. Has thought been given to usability?"  | 5 | Ensure intuitive navigation, clear instructions for the game, and helpful feedback on forms (e.g., "Password must be 8 characters"). | Register a new account, pointing out the clear form labels and validation feedback. Play the game, explaining the obvious controls. |
| **Game** |  |  |  |
| "Basic game. The website has a basic game that the user can play and obtain a score."  | 5 | Implement a complete game loop: start, play, win/lose condition, and score calculation. | Play one full round of the game from start to finish and show the final score. |
| "Modules. Use of modules to organize game code."  | 2.5 | Structure JavaScript using ES6 modules (`import`/`export`) to separate concerns (e.g., `game.js`, `player.js`, `ui.js`). | Briefly show the file structure and the `import`/`export` syntax in your JS files. |
| "Classes. Use of classes to organize game code."  | 2.5 | Use JavaScript classes for game objects (e.g., `class Player`, `class Enemy`, `class GameState`). | Briefly show the class definitions in your code for key game components. |
| "Graphics. Game has graphical elements."  | 5 | Use HTML Canvas or SVG for game graphics, or use custom CSS-styled `div`s. Avoid plain text-based games. | Showcase the visual elements of the game in motion during gameplay. |
| "Advanced game functionality. ...complex JavaScript and a substantial amount of code (\>500 lines)."  | 10 | Implement features beyond the basics: multiple levels, different enemy types, power-ups, sophisticated scoring logic, animations, or use of a game engine. | Demonstrate an advanced feature, like progressing to a second level with increased difficulty or using a special power-up. |
| **User Accounts** |  |  |  |
| "Storage of basic data in JSON format, such as name and email address."  | 5 | On registration, create a user object with name/email, `JSON.stringify()` it, and save it to local storage. | After registering, use browser developer tools to show the user data stored as a JSON string in local storage. |
| "Storage of additional data...for example address and phone number."  | 5 | Add optional fields like address and phone number to the registration form and include them in the stored user object. | Register a user with the additional optional fields and show them in the local storage JSON object. |
| "Validation of user data. Some of this validation must be done using JavaScript"  | 5 | Use JavaScript to validate form inputs (e.g., email format, password complexity, non-empty fields). Provide custom error messages. Use minimal HTML validation to secure max marks. | Attempt to submit the registration form with invalid data (e.g., a bad email, a short password) and show the JavaScript-powered error messages appearing on the page. |
| "Login with appropriate error messages"  | 5 | Create a login form that checks credentials against local storage. Display specific error messages for "User not found" or "Incorrect password". | Attempt to log in with a non-existent username. Then, use a correct username but an incorrect password, showing the different error messages each time. |
| **Ranking Table** |  |  |  |
| "Storage of users' top scores in JSON format using HTML local storage."  | 5 | After a game, get the user's score. Load the scores array from local storage, add the new score, and save it back as a JSON string. | After playing a game, show the updated scores array for that user in the browser's local storage inspector. |
| "Rankings page that lists the top scores of all users."  | 5 | Create a page that reads all user data from local storage, extracts all scores, sorts them in descending order, and displays them in a clear table. | After several users have scores, go to the rankings page and show the sorted list of all top scores. |
| **Code & Report Quality** |  |  |  |
| "HTML, CSS, JavaScript code quality."  | 7.5 | Ensure code is well-commented, consistently formatted/indented, and uses meaningful variable names. Remove all commented-out code and unused files. | Briefly scroll through your HTML, CSS, and JS files, pointing out the clean structure, comments, and consistent naming conventions. |
| "File organization."  | 2.5 | Organize files into logical folders (e.g., `/css`, `/js`, `/images`, `/pages`). | Show the project's folder structure in your code editor or file explorer. |
| "Project report. Screenshot(s) of all the website's page(s)."  | 2 | Include clear, high-resolution screenshots of the game, login, registration, and rankings pages in the report. | The report itself is the evidence. |
| "Content of report. Does it clearly describe the project?"  | 4 | Write a clear description of the game rules, user account functionality (registration, login, validation), and how the ranking system works. | The report itself is the evidence. |
| "Report quality. Report should be tidily laid out with a cover sheet."  | 4 | Use a cover sheet, justify text, use headings, and proofread carefully for spelling and grammar mistakes. | The report itself is the evidence. |

-----

### **3. Complete Deliverables Checklist**

Submit a single zip file named `YourStudentID_CST2120_CW1.zip` containing the following structure:

- `YourStudentID_CST2120_CW1.zip`
    - `/website_code/`
        - `index.html`
        - `game.html`
        - `register.html`
        - `login.html`
        - `rankings.html`
        - `/css/`
            - `style.css`
        - `/js/`
            - `main.js`
            - `game.js`
            - `auth.js`
        - `/images/`
            - `player_sprite.png`
            - `background.jpg`
    - `Report.pdf` (or `Report.docx`)
    - `Video_Demonstration.mp4`

-----

### **4. Report Structure (Max 2500 Words)**

1. **Cover Sheet** (1 page)
    - Course Name: CST2120 - Web Applications and Databases
    - Assessment: Coursework 1 - Game Website
    - Your Name & Student ID
    - Date
2. **Introduction** (Approx. 250 words)
    - Brief overview of the project, the name of your game, and the core technologies used (HTML, CSS, JavaScript, Local Storage).
3. **Website Design and Usability** (Approx. 400 words)
    - Describe the site structure, navigation, and visual theme. Explain design choices made for attractiveness and user-friendliness.
    - Include **screenshots** of each main page/view (Home/Game, Registration, Login, Rankings).
4. **Game Implementation** (Approx. 700 words)
    - Explain the game's concept, rules, and scoring mechanism.
    - Detail the technical implementation, including the use of classes and modules, handling of game state, and any advanced functionality (e.g., levels, graphics rendering).
5. **User Account and Scoring System** (Approx. 650 words)
    - Describe the registration process, including the data stored (basic and additional).
    - Explain the JavaScript validation logic and error handling for registration and login.
    - Detail how user data and scores are structured and stored in local storage as JSON.
    - Explain how the rankings page fetches, sorts, and displays scores.
6. **Development Issues** (Approx. 300 words)
    - Briefly discuss any challenges encountered during development and how you overcame them. This shows critical reflection.
7. **Conclusion** (Approx. 200 words)
    - Summarize the completed project and its key features.

-----

### **5. Weekly Production Timeline**

**DEADLINE: 16:00 Friday 31st October 2025**. Submit on time; late penalties are strict.

- **Week 1 (Sep 25 - Oct 3): Foundation & Game Concept**
    - **Milestones:**
        - Finalize game idea and rules.
        - Set up project folder structure.
        - Create basic HTML and CSS for all pages (game, login, register, rankings) with a consistent navigation bar.
    - **QA Checkpoint:** All pages link correctly via the navigation bar. The visual theme is consistent.
- **Week 2 (Oct 4 - Oct 10): Core Game Logic**
    - **Milestones:**
        - Implement the basic, playable game using JavaScript classes and modules.
        - Add score-keeping functionality.
        - Implement graphical elements for the game.
    - **QA Checkpoint:** The game can be played from start to finish, and a score is generated.
- **Week 3 (Oct 11 - Oct 17): User Accounts**
    - **Milestones:**
        - Build the registration form and functionality to save user data (basic + additional) to local storage.
        - Implement comprehensive JavaScript validation and error handling.
        - Build the login system with credential checking and error messages.
    - **QA Checkpoint:** Can successfully register a user, see data in local storage, and log in/out. Validation errors appear correctly.
- **Week 4 (Oct 18 - Oct 24): Scoring & Advanced Features**
    - **Milestones:**
        - Link game scores to logged-in users and save them to local storage.
        - Build the rankings page to display all users' top scores correctly.
        - Implement "Advanced game functionality" (e.g., levels, animations).
    - **QA Checkpoint:** Scores save correctly after a game. Rankings page updates and sorts scores accurately.
- **Week 5 (Oct 25 - Oct 31): Finalization & Submission**
    - **Milestones:**
        - **Mon-Tue:** Write the full project report. Clean all code (remove comments, unused files) and add final comments.
        - **Wed:** Record and edit the 5-minute video demonstration, ensuring all functionality is shown.
        - **Thu:** Final review. Use the proofreading checklist below. Zip all files.
        - **Fri (AM): SUBMIT EARLY.** Do not wait until 15:59.
    - **QA Checkpoint:** All files are named correctly and present in the final zip file. The video is under 5 minutes and covers everything.

-----

### **6. Action Plan to Maximize Marks**

  * **Website Attractiveness:** Use a CSS preprocessor like SASS for better organization. For error messages, create custom, non-blocking notification elements instead of `alert()`.
  * **Advanced Game:** To secure the 10 marks for "Advanced game functionality", aim for over 500 lines of JavaScript for the game logic alone. Implement a clear progression system, like increasing speed or adding new enemy types every 1000 points. **Evidence:** Demonstrate this progression in the video.
  * **JavaScript Validation:** For the 5 marks, ensure most validation is in JavaScript. For example, check for password confirmation mismatch in real-time as the user types. **Evidence:** In the video, type a non-matching password and show the error message appear instantly without a page reload.
  * **Code Quality:** Use a linter (like ESLint) to maintain consistent code style. Add JSDoc-style comments to your functions and classes to explain what they do, what parameters they take, and what they return. **Evidence:** Briefly show this clean, commented code in your video or mention it in your report.
  * **Report Quality:** Use a word processor's built-in grammar and spell checker. Export the final document to PDF to ensure formatting is preserved. **Evidence:** A professionally formatted PDF.
  * **Video Demonstration:** Plan your video script. Move efficiently from one feature to the next. For example: "Here is the registration page. I will now attempt to register with an invalid email, showing the JS validation. Now with a valid email. I will now check local storage to show the user data stored in JSON format." This proves you've hit the criteria.

-----

### **7. Final Marking-Evidence Proofreading Checklist**

**Project Files:**

  * [ ] Is the final submission a single `.zip` file? 
  * [ ] Does the zip contain the website code, the report, and the video?
  * [ ] Is all PHP or server-side code removed? (Results in zero marks for that functionality).
  * [ ] Is all database code removed? (Local storage must be used).
  * [ ] Are all unused files and commented-out code blocks deleted?
  * [ ] Is the file structure organized into folders (`css`, `js`, etc.)?

**Video (Under 5 mins):**

  * [ ] Does the video demonstrate user registration?
  * [ ] Does it show validation error messages for registration?
  * [ ] Does it show a successful login?
  * [ ] Does it show error messages for a failed login?
  * [ ] Does it show a full round of gameplay?
  * [ ] Does it show the score being calculated and stored?
  * [ ] Does it show the rankings page with sorted scores from multiple users?
  * [ ] Does it explicitly show the data stored in **JSON format in HTML local storage** using browser dev tools?

**Report (Under 2500 words):**

  * [ ] Does it have a cover sheet?
  * [ ] Is the text justified?
  * [ ] Are there clear headings for sections?
  * [ ] Are there high-quality screenshots for all pages?
  * [ ] Has it been proofread for spelling and grammar?

