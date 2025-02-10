const AWS_ENDPOINT = "https://jv8cdj610e.execute-api.us-east-1.amazonaws.com/dev/rmpProxy";

// check if tab is on patriotweb
function updateIcon(tabId, url) {
    if (url && url.includes("ssbstureg.gmu.edu/StudentRegistrationSsb/ssb/classSearch/classSearch")) {
        chrome.action.enable(tabId);  // enable extension icon
    } else {
        chrome.action.disable(tabId); // grey out extension icon
    }
}

// listener for tab updates (when a user navigates to a new page)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        updateIcon(tabId, tab.url);
    }
});

// listener for tab switching (when a user switches between open tabs)
chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }
        updateIcon(activeInfo.tabId, tab.url);
    });
});

// fetchProfessorData: calls API and retreives info
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchProfessorData') {
      fetch('https://jv8cdj610e.execute-api.us-east-1.amazonaws.com/dev/rmpProxy', { 
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic dGVzdDp0ZXN0", // GraphQL Auth
        },
        body: JSON.stringify({ professorName: request.professorName })
      })
        .then(response => {
          if (!response.ok) {
            response.text().then(errorData => {
              sendResponse({ ok: false, status: response.status, error: errorData });
            });
          } else {
            response.json().then(data => {
              sendResponse({ ok: true, data });
            });
          }
        })
        .catch(error => {
          sendResponse({ ok: false, error: error.toString() });
        });
      return true; 
    }
  });


