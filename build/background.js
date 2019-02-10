let Http;


chrome.contextMenus.create({
    id: 'getApiCalls',
    title: 'Download Data',
    contexts: ['all']
});

chrome.contextMenus.onClicked.addListener(() => {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        let requests = tabStorage[tabs[0].id].requests;
        console.log(requests)
        for (let key in requests) {
            console.log(requests[key].url)
            Http = new XMLHttpRequest();
            makeRequest(Http, requests[key].url)
        }
    });
});

chrome.tabs.onUpdated.addListener(function
        (tabId, changeInfo, tab) {
        // read changeInfo data and do something with it (like read the url)

        if (changeInfo.url) {
            previousUrl = currentUrl;
            currentUrl = changeInfo.url;
            if (!(previousUrl.includes(currentUrl) || currentUrl.includes(previousUrl))){
                tabStorage[tabId].requests = {};
            }
        }
    }
);


const makeRequest = (Http, url) => {
    Http.open("GET", url);
    Http.send();
    Http.onload = (e) => {
        let json = JSON.parse(Http.responseText);
        console.log("making request")
        console.log(url)
        console.log(json)
        let params = json.parameters;
        let resultSets = getResultSets(json);
        for (let resSetKey in resultSets) {
            let fileResults = resultSets[resSetKey];

            let fileName = parseFileName(json.resource, fileResults.name, params);
            let headers = parseHeaders(fileResults);
            let rowData = fileResults.rowSet;

            let csvContent = "";
            csvContent += makeRowToCsv(headers);
            rowData.forEach(function (row) {
                if (row != null) {
                    csvContent += makeRowToCsv(row);
                }
            });

            if (window.confirm("Do you really want to Save Data From: " + json.resource + " - " + fileResults.name + "\n\n" + makeURLPretty(url))) {

                let csvData = new Blob([csvContent], {type: 'text/csv'});
                let uri = URL.createObjectURL(csvData);

                let link = document.createElement("a");
                link.setAttribute("href", uri);
                link.setAttribute("download", fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }
};

const parseHeaders = (fileResults) => {
    let headers = fileResults.headers;
    let cols = fileResults.rowSet[0].length;

    if (headers.length === cols) {
        return fileResults.headers
    }
    for (let k in fileResults.headers) {
        if (fileResults.headers[k].columnNames.length === cols) {
            return fileResults.headers[k].columnNames
        }
    }
    return [];

};

const parseFileName = (resource, name, params) => {
    return resource + "_" + name + "_" + parseParams(params)
};

const parseParams = (params) => {
    let str = "";
    for (let k in params) {
        if (params[k] != null && params[k] !== "" && params[k] !== "0" && params[k] !== 0 && params[k] !== "N" && params[k] !== "Y" && params[k] !== "Base")
            str = str + "_" + k + "-" + params[k]
    }
    return str;
};

const getResultSets = (json) => {
    if (json.resultSets == null) {
        return [json.resultSet];
    } else if (!Array.isArray(json.resultSets)) {
        return [json.resultSets]
    } else {
        return json.resultSets
    }
};

const makeRowToCsv = (row) => {
    let rowData = row.map(function (v) {
        if (typeof v === 'string' || v instanceof String) {
            return v.replace(/,/g, "");
        }
        return v;
    }).join(",");
    return rowData + '\r\n';
};

const makeURLPretty = (url) => {
    try {
        const splitUrl = url.split("?");
        const base = splitUrl[0];
        const params = splitUrl[1];

        const paramsArray = params.split("&");

        let paramString = paramsArray.filter((v) => {
            return v[v.length - 1] !== '=';
        }).join("\n");

        return base + "\n\n" + "With parameters: \n" + paramString

    } catch (e) {
        return url;
    }

};


const networkFilters = {
    urls: [
        "*://stats.nba.com/stats/*"
    ]
};

const tabStorage = {};

let currentUrl = undefined;
let previousUrl = undefined;


chrome.webRequest.onBeforeRequest.addListener((details) => {
    const {tabId, requestId} = details;
    if (!tabStorage.hasOwnProperty(tabId)) {
        return;
    }
    tabStorage[tabId].requests[details.url] = {
        url: details.url,
    };
}, networkFilters);

chrome.tabs.onActivated.addListener((tab) => {
    const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
    if (!tabStorage.hasOwnProperty(tabId)) {
        tabStorage[tabId] = {
            id: tabId,
            requests: {},
            registerTime: new Date().getTime()
        };
    }
});

chrome.tabs.onRemoved.addListener((tab) => {
    const tabId = tab.tabId;
    if (!tabStorage.hasOwnProperty(tabId)) {
        return;
    }
    tabStorage[tabId] = null;
});