(async () => {
    // track already processed elements
    const processedElements = new WeakSet();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE){
                    const professorElements = node.querySelectorAll
                    ? node.querySelectorAll('td[data-property="instructor"]')
                    : [];

                    professorElements.forEach(async td => {
                        if (processedElements.has(td)) return;
                        processedElements.add(td);

                        let professorName = td.querySelector("a.email")?.textContent?.trim();
                        if (!professorName) return;

                        // strip pronouns
                        professorName = professorName.replace(/\s*\(.*?\)\s*/g, '').trim();

                        let formattedName;
                        if (professorName.includes(",")) {
                            const [lastName, firstName] = professorName.split(',').map(name => name.trim());
                            formattedName = `${firstName} ${lastName}`;
                        } else {
                            formattedName = professorName;
                        }

                        await fetchProfessorData(formattedName, td);
                    })
                }
            })
        })
  });

  observer.observe(document.body, {
      childList: true,
      subtree: true
  });
})();

// calls fetchProfessorData from background script
async function fetchProfessorData(professorName, instructorElement) {
    try {
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              { action: 'fetchProfessorData', professorName },
              (response) => {
                if (chrome.runtime.lastError) {
                  return reject(chrome.runtime.lastError);
                }
                resolve(response);
              }
            );
        });
  
        if (!response.ok) {
            throw new Error(`ERROR: Status: ${response.status}`);
        }
  
        const data = response.data;
        //console.log(`Successful API Response: ${professorName}:`, data);
  
        if (Array.isArray(data) && data.length > 0) {
            const professor = data.find(p => p.school.name === "George Mason University");
            if (professor) {
                updateInstructorBox(instructorElement, professor);
                setColumnWidth();
            }
        } else {
            console.log(`Prof not found ${professorName}`);
        }
    } catch (error) {
        console.error("Error:", error);
    }
  }

  function updateInstructorBox(instructorElement, professor) {
    const { id, firstName, lastName, avgRating, numRatings, avgDifficulty, wouldTakeAgainPercent } = professor;

    // Decode the ID (extracted as base-64) in format "Teacher-XXXXXXX"
    let decodedId = atob(id).replace("Teacher-", ""); 

    // Clear instructor entry
    instructorElement.innerHTML = ""; 

    // Create a new container div for the styled section
    const rmpDiv = document.createElement("div");
    rmpDiv.className = "rmp-info-container";
    rmpDiv.style.display = "flex"; 
    rmpDiv.style.flexDirection = "column"; 
    rmpDiv.style.padding = "8px";
    rmpDiv.style.border = "1px solid #ddd"; 
    rmpDiv.style.backgroundColor = "#f8f8f8";
    rmpDiv.style.borderRadius = "6px";
    rmpDiv.style.width = "230px";
    rmpDiv.style.boxShadow = "2px 2px 6px rgba(0, 0, 0, 0.1)";
    rmpDiv.style.position = "relative"; 

    // Name header (placed top left)
    const nameHeader = document.createElement("h3");
    nameHeader.textContent = `${firstName} ${lastName}`;
    nameHeader.style.margin = "0";
    nameHeader.style.fontSize = "14px";
    nameHeader.style.fontWeight = "bold";
    nameHeader.style.color = "#191919";
    nameHeader.style.textAlign = "left";
    nameHeader.style.paddingBottom = "4px";

    rmpDiv.appendChild(nameHeader);

    // Rating progress bar 
    if (typeof avgRating === "number") {
        const progressContainer = document.createElement("div");
        progressContainer.style.width = "100%";
        progressContainer.style.height = "8px";
        progressContainer.style.backgroundColor = "#ddd";
        progressContainer.style.borderRadius = "5px";
        progressContainer.style.overflow = "hidden";
        progressContainer.style.marginBottom = "8px";

        const progressBar = document.createElement("div");
        progressBar.style.height = "100%";
        progressBar.style.width = `${(avgRating / 5) * 100}%`;
        progressBar.style.borderRadius = "5px";
        progressBar.style.transition = "width 0.5s ease-in-out";

        // hue for progress bar
        const hue = (avgRating / 5) * 120;
        progressBar.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

        progressContainer.appendChild(progressBar);
        rmpDiv.appendChild(progressContainer);
    }

    // Ratings container
    const ratingsDiv = document.createElement("div");
    ratingsDiv.style.display = "flex";
    ratingsDiv.style.flexDirection = "column";
    ratingsDiv.style.gap = "4px";
    ratingsDiv.style.fontSize = "12px";
    ratingsDiv.style.color = "#555";
    
    // set data format
    ratingsDiv.innerHTML = `
        <div><strong>⭐ Rating:</strong> ${avgRating || "N/A"} / 5</div>
        <div><strong>📚 Would Take Again:</strong> ${wouldTakeAgainPercent ? Math.round(wouldTakeAgainPercent) + "%" : "N/A"}</div>
        <div><strong>📊 Difficulty:</strong> ${avgDifficulty || "N/A"}</div>
        <div><strong>📝 Reviews:</strong> ${numRatings || "N/A"}</div>
    `;

    rmpDiv.appendChild(ratingsDiv);

    // "View Profile" link (bottom right)
    const rmpLink = document.createElement("a");
    rmpLink.href = `https://www.ratemyprofessors.com/professor/${decodedId}`;
    rmpLink.target = "_blank";
    rmpLink.textContent = "View Profile";
    rmpLink.style.position = "absolute";
    rmpLink.style.bottom = "8px"; 
    rmpLink.style.right = "8px";
    rmpLink.style.color = "#0073e6";
    rmpLink.style.fontWeight = "bold";
    rmpLink.style.textDecoration = "none";
    rmpLink.style.fontSize = "12px";

    rmpDiv.appendChild(rmpLink);
    instructorElement.appendChild(rmpDiv);
}

// override original column width to display all info in box
function setColumnWidth(){
    const header = document.querySelector('th[data-property="instructor"]');

    if (header){
        header.style.width = "257px";
    }
    else{
        console.warn("elem not found");
    }
}

