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

    // Decode the ID
    let decodedId = atob(id).replace("Teacher-", ""); 

    // Clear instructor entry
    instructorElement.innerHTML = ""; 

    // adjust instructor column width
    const instructorCol = document.querySelector('th.instructor-col');
    if (instructorCol) {
        instructorCol.style.width = '19%';
        instructorCol.style.minWidth = '240px';
    }

    // Create main container
    const rmpDiv = document.createElement("div");
    Object.assign(rmpDiv.style, {
        position: "relative",
        padding: "16px",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        border: "1px solid #e0e0e0",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        width: "240px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#333333"
    });

    // Header container
    const headerContainer = document.createElement("div");
    Object.assign(headerContainer.style, {
        display: "flex",
        gap: "8px",
        marginBottom: "12px"
    });

    // Rating badge (left side)
    if (typeof avgRating === "number") {
        const ratingBadge = document.createElement("div");
        const hue = (avgRating / 5) * 120; // Green (120) to red (0)
        Object.assign(ratingBadge.style, {
            width: "40px",
            height: "40px",
            borderRadius: "6px",
            backgroundColor: `hsl(${hue}, 70%, 40%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "16px",
            fontWeight: "600",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            flexShrink: "0"
        });
        ratingBadge.textContent = avgRating.toFixed(1);
        headerContainer.appendChild(ratingBadge);
    }

    // Name section (right of badge)
    const nameHeader = document.createElement("div");
    nameHeader.textContent = `${firstName} ${lastName}`;
    Object.assign(nameHeader.style, {
        fontSize: "16px",
        fontWeight: "600",
        color: "#1a1a1a",
        alignSelf: "center"
    });
    headerContainer.appendChild(nameHeader);
    rmpDiv.appendChild(headerContainer);

    // Stats grid
    const statsGrid = document.createElement("div");
    Object.assign(statsGrid.style, {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "12px 16px",
        marginBottom: "8px"
    });

    const createStat = (label, value, icon, isDifficulty = false) => {
        const container = document.createElement("div");
        const valueText = typeof value === "number" ? 
            (isDifficulty ? value.toFixed(1) : Math.round(value)) : "N/A";
        
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 14px;">${icon}</span>
                <div style="flex: 1;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 2px;">${label}</div>
                    <div style="font-size: 14px; font-weight: 500;">${valueText}${label === 'TAKE AGAIN' ? '%' : ''}</div>
                </div>
            </div>
        `;

        // Add difficulty progress bar
        if (isDifficulty && typeof value === "number") {
            const difficultyHue = ((5 - value) / 5) * 120;
            const progressContainer = document.createElement("div");
            Object.assign(progressContainer.style, {
                height: "4px",
                backgroundColor: "#eee",
                borderRadius: "2px",
                overflow: "hidden",
                marginTop: "4px"
            });

            const progressBar = document.createElement("div");
            Object.assign(progressBar.style, {
                width: `${(value / 5) * 100}%`,
                height: "100%",
                backgroundColor: `hsl(${difficultyHue}, 70%, 40%)`,
                transition: "width 0.3s ease"
            });

            progressContainer.appendChild(progressBar);
            container.appendChild(progressContainer);
        }

        return container;
    };

    statsGrid.appendChild(createStat("DIFFICULTY", avgDifficulty, "📊", true));
    statsGrid.appendChild(createStat("TAKE AGAIN", wouldTakeAgainPercent, "🔄"));
    //statsGrid.appendChild(createStat("REVIEWS", numRatings, "📝"));

    // View Profile button
    const rmpLink = document.createElement("a");
    rmpLink.href = `https://www.ratemyprofessors.com/professor/${decodedId}`;
    rmpLink.target = "_blank";
    rmpLink.textContent = "View Profile →";
    Object.assign(rmpLink.style, {
        display: "flex",
        alignItems: "center",
        padding: "6px 10px",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        color: "#333",
        textDecoration: "none",
        fontSize: "12px",
        fontWeight: "500",
        transition: "background-color 0.2s ease",
        gridColumn: "span 2"
    });

    // Create container for reviews and profile link
    const bottomRow = document.createElement("div");
    Object.assign(bottomRow.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "8px"
    });
    
    // Add reviews and link to bottom row
    bottomRow.appendChild(createStat("REVIEWS", numRatings, "📝"));
    bottomRow.appendChild(rmpLink);

    // Hover effect
    rmpLink.addEventListener('mouseenter', () => {
        rmpLink.style.backgroundColor = "#eee";
    });
    rmpLink.addEventListener('mouseleave', () => {
        rmpLink.style.backgroundColor = "#f5f5f5";
    });

    rmpDiv.appendChild(statsGrid);
    rmpDiv.appendChild(bottomRow);
    instructorElement.appendChild(rmpDiv);
}

