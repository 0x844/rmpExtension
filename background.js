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


