(async () => {
  const observer = new MutationObserver(async () => {
      const professorElements = document.querySelectorAll('td[data-property="instructor"]');

      // once user reaches page with courses listed (prevents browser from attempting to gather data from "search" page)
      if (professorElements.length > 0) {
          observer.disconnect(); // Stop observing once elements are found

          professorElements.forEach(async td => {
              let professorName = td.querySelector("a.email")?.textContent.trim();
              if (!professorName) return;

              // Strip pronouns
              professorName = professorName.replace(/\s*\(.*?\)\s*/g, '').trim();

              // convert to firstName lastName format
              let formattedName;
              if (professorName.includes(",")) {
                  const [lastName, firstName] = professorName.split(',').map(name => name.trim());
                  formattedName = `${firstName} ${lastName}`;
              } else {
                  formattedName = professorName;
              }

              // Pass formatted name and the instructor's <td> element
              await fetchProfessorData(formattedName, td);
          });
      }
  });

  observer.observe(document.body, {
      childList: true,
      subtree: true
  });
})();

async function fetchProfessorData(professorName, instructorElement) {
  try {
      const response = await fetch('https://jv8cdj610e.execute-api.us-east-1.amazonaws.com/dev/rmpProxy', {
          method: 'POST',
          headers: {
              "Content-Type": "application/json",
              "Authorization": "Basic dGVzdDp0ZXN0",
          },
          body: JSON.stringify({ professorName })
      });

      if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`HTTP error! Status: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log(`Successful API Response: ${professorName}:`, data);

      if (Array.isArray(data) && data.length > 0) {
          const professor = data.find(p => p.school.name === "George Mason University");
          if (professor) {
              updateInstructorBox(instructorElement, professor);
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

  // Decode the Base64 ID
  let decodedId = atob(id).replace("Teacher-", "");  // Remove "Teacher-" prefix

  // Clear out the current instructor name from the <td>
  instructorElement.innerHTML = ""; 

  // Create a new container div for the styled section
  const rmpDiv = document.createElement("div");
  rmpDiv.className = "rmp-info-container";
  rmpDiv.style.display = "flex"; 
  rmpDiv.style.flexDirection = "column"; 
  rmpDiv.style.padding = "8px"; 
  rmpDiv.style.border = "1px solid #ddd"; 
  rmpDiv.style.backgroundColor = "#f8f8f8";

  // Create a header for the professor's name with styling
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

  // Create RMP profile link
  const rmpLink = document.createElement("a");
  rmpLink.href = `https://www.ratemyprofessors.com/professor/${decodedId}`;  // Direct link
  rmpLink.target = "_blank";
  rmpLink.textContent = "View RMP Profile";
  rmpLink.style.display = "inline-block";
  rmpLink.style.marginTop = "5px";
  rmpLink.style.color = "blue";
  rmpLink.style.fontWeight = "bold";
  rmpLink.style.textDecoration = "none";

  // Append all the new elements to the rmpDiv
  rmpDiv.appendChild(nameHeader);
  rmpDiv.appendChild(ratingsDiv);
  rmpDiv.appendChild(rmpLink);

  // Append the newly created div to the instructor <td>
  instructorElement.appendChild(rmpDiv);
}

