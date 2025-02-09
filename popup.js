// popup.js

chrome.storage.local.get('professorData', function(data) {
  const infoDiv = document.getElementById('professor-info');
  
  if (chrome.runtime.lastError) {
    console.error("Error fetching data from storage:", chrome.runtime.lastError);
  } else if (data && data.professorData) {
    // Display professor data if it exists
    data.professorData.forEach(prof => {
      const professorDiv = document.createElement('div');
      professorDiv.textContent = `Professor: ${prof.name} - Rating: ${prof.rating}`;
      infoDiv.appendChild(professorDiv);
    });
  } else {
    infoDiv.textContent = 'No professor data found.';
  }
});
