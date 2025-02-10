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
            console.log(`No data for ${professorName}`);
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
  }

function updateInstructorBox(instructorElement, professor) {
  const { id, firstName, lastName, avgRating, numRatings, difficulty } = professor;

  // Decode the ID (extracted as base-64) in format "Teacher-XXXXXXX"
  let decodedId = atob(id).replace("Teacher-", ""); 

  // clear instructor entry
  instructorElement.innerHTML = ""; 

  // Create a new container div for the styled section
  const rmpDiv = document.createElement("div");
  rmpDiv.className = "rmp-info-container";
  rmpDiv.style.display = "flex"; 
  rmpDiv.style.flexDirection = "column"; 
  rmpDiv.style.padding = "8px"; 
  rmpDiv.style.border = "1px solid #ddd"; 
  rmpDiv.style.backgroundColor = "#f8f8f8";

  const nameHeader = document.createElement("h3");
  nameHeader.textContent = `${lastName}, ${firstName}`;
  nameHeader.style.margin = "0";
  nameHeader.style.fontSize = "16px";
  nameHeader.style.fontWeight = "bold";
  nameHeader.style.color = "#333";

  // Add rating, difficulty, and number of reviews
  const ratingsDiv = document.createElement("div");
  ratingsDiv.style.marginTop = "5px";
  ratingsDiv.innerHTML = `
      <strong>RMP Rating:</strong> ⭐ ${avgRating || "N/A"} / 5
      <br>
      <strong>Difficulty:</strong> 🎯 ${difficulty || "N/A"} 
      <br>
      <strong>Reviews:</strong> ${numRatings || "N/A"}
  `;
  ratingsDiv.style.fontSize = "12px";
  ratingsDiv.style.color = "#555";

  // Add RMP info
  const rmpLink = document.createElement("a");
  rmpLink.href = `https://www.ratemyprofessors.com/professor/${decodedId}`;
  rmpLink.target = "_blank";
  rmpLink.textContent = "View RMP Profile";
  rmpLink.style.display = "inline-block";
  rmpLink.style.marginTop = "5px";
  rmpLink.style.color = "blue";
  rmpLink.style.fontWeight = "bold";
  rmpLink.style.textDecoration = "none";

  rmpDiv.appendChild(nameHeader);
  rmpDiv.appendChild(ratingsDiv);
  rmpDiv.appendChild(rmpLink);

  instructorElement.appendChild(rmpDiv);
}

// override original column width to display all info in box
function setColumnWidth(){
    const header = document.querySelector('th[data-property="instructor"]');

    if (header){
        header.style.width = "300px";

    }
    else{
        console.warn("elem not found");
    }
}

