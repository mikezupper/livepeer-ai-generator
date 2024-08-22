// src/db.js
import Dexie from 'dexie';
import { getGatewayUrl } from './utils';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

export const db = new Dexie('OrchestratorDB');

// Define a schema for your table
db.version(1).stores({
  orchestrators: 'eth_address, total_stake, reward_cut, fee_cut, activation_status, name, service_uri, avatar',
  capabilities: 'name',
  capabilitiesLastFetch: 'key, timestamp'
});

const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

const shouldFetchNewCaps = async () => {
    const lastFetch = await db.capabilitiesLastFetch.get('capabilities');
    const now = Date.now();

    if (lastFetch && (now - lastFetch.timestamp) < FIVE_MINUTES) {
        console.log('Fetch skipped, using cached data.');
        return false;
    }

    // Update the last fetch timestamp
    await db.capabilitiesLastFetch.put({ key: 'capabilities', timestamp: now });
    return true;
}

export const fetchNewCaps = () => {
    return fromPromise(
        shouldFetchNewCaps().then(shouldFetch => {
            if (!shouldFetch) {
                return; // Skip the fetch if within 5 minutes
            }

            let gw = getGatewayUrl();
            let url = `${gw}/getNetworkCapabilities`;
            return fetch(url, {
                method: "GET",
                mode: "cors",
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(async data => {
                    const pipelines = {};
                    const supportedPipelines = data.supported_pipelines;
                    const orchestrators = data.orchestrators;

                    for (let pipelineName in supportedPipelines) {
                        let pipelineModels = [];

                        for (let modelName in supportedPipelines[pipelineName]) {
                            let modelData = supportedPipelines[pipelineName][modelName];
                            let orchestratorList = [];

                            for (let orchestrator in orchestrators) {
                                let pipelineOrchestrator = orchestrators[orchestrator]["Pipelines"][pipelineName];

                                if (pipelineOrchestrator && pipelineOrchestrator[modelName]) {
                                    const storedOrchestrator = await db.orchestrators.get(orchestrator);
                                    orchestratorList.push({
                                        ethAddress: storedOrchestrator?.name || orchestrator,
                                        warm: pipelineOrchestrator[modelName].Warm
                                    });
                                }
                            }

                            pipelineModels.push({
                                name: modelName,
                                Cold: modelData.Cold,
                                Warm: modelData.Warm,
                                orchestrators: orchestratorList
                            });
                        }

                        pipelines[pipelineName] = {
                            name: pipelineName,
                            models: pipelineModels
                        };
                    }

                    // Clear the current capabilities table
                    await db.capabilities.clear();

                    // Insert the new capabilities data into Dexie
                    for (let pipelineName in pipelines) {
                        await db.capabilities.add({
                            name: pipelineName,
                            models: pipelines[pipelineName].models
                        });
                    }

                    return pipelines;
                });
        })
    );
}

async function checkAndFetchOrchestrators() {
    try {
        // Check if the database is empty
        const count = await db.orchestrators.count();

        if (count === 0) {
            console.log('Database is empty, fetching data...');
            await fetchAndStoreOrchestrators();
        } else {
            console.log('Database is not empty, skipping initial fetch.');
        }

        // Set up a 12-hour interval to fetch and update the database
        setInterval(async () => {
            console.log('12 hours have passed, fetching data again...');
            await fetchAndStoreOrchestrators();
        }, 12 * 60 * 60 * 1000); // 12 hours in milliseconds

    } catch (error) {
        console.error('Error checking or fetching orchestrators:', error);
    }
}

const fetchAndStoreOrchestrators = async () => {
    try {
        const response = await fetch('https://tools.livepeer.cloud/api/orchestrator', {
            method: "GET",
            mode: "cors",
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const orchestrators = await response.json();

        // Clear the table before adding new data
        await db.orchestrators.clear();

        // Bulk add the orchestrators to the Dexie table
        await db.orchestrators.bulkAdd(orchestrators);
    } catch (error) {
        console.error('Error fetching or storing orchestrators:', error);
    }
}

// Call the function to fetch and store data
checkAndFetchOrchestrators();

fetchNewCaps().subscribe(pipelines => {
    if (pipelines) {
        console.log('Pipelines data fetched and stored:', pipelines);
    } else {
        console.log('Skipped fetching new capabilities, using existing data.');
    }
});