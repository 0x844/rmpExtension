console.log("✅ Content script loaded, modifying instructor names...");

// Wait for elements to load before modifying
function waitForInstructors() {
    let instructorCells = document.querySelectorAll('td[data-property="instructor"] a.email');

    if (instructorCells.length > 0) {
        console.log(`✅ Found ${instructorCells.length} instructors, updating names...`);

        instructorCells.forEach(a => {
            let instructorName = a.textContent.split("(")[0].trim();  // Extract name before pronouns
            let encodedName = encodeURIComponent(instructorName);  // Encode for URL

            // Create RMP button
            let rmpButton = document.createElement("a");
            rmpButton.href = `https://www.ratemyprofessors.com/search/teachers?query=${encodedName}`;
            rmpButton.target = "_blank";
            rmpButton.textContent = " RMP";
            rmpButton.style.marginLeft = "10px";
            rmpButton.style.color = "blue";
            rmpButton.style.fontWeight = "bold";

            // Add RMP button next to instructor name
            a.parentElement.appendChild(rmpButton);
        });

        console.log("✅ Instructor names updated with RMP buttons!");
    } else {
        console.log("⏳ Waiting for instructor names...");
        setTimeout(waitForInstructors, 500);  // Retry after 500ms
    }
}

// Start checking for elements
waitForInstructors();
