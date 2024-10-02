import Dexie from 'dexie';
import {getGatewayUrl} from "../utils.js";

class GatewayDataFetcher {
    constructor() {
        this.db = new Dexie('AiGeneratorDB');
        this.db.version(1).stores({
            orchestrators: 'eth_address, total_stake, reward_cut, fee_cut, activation_status, name, service_uri, avatar',
            capabilities: 'name'
        });

        this.initialize().then(()=>console.log("GatewayDataFetcher initialized."));
    }

    async initialize() {
        await this.checkAndFetchOrchestrators();
        await this.checkAndFetchCapabilities();
    }

    async checkAndFetchOrchestrators() {
        try {
            const count = await this.db.orchestrators.count();

            if (count === 0) {
                console.log('[GatewayDataFetcher] Orchestrator Database is empty, fetching data...');
                await this.fetchAndStoreOrchestrators();
            } else {
                console.log('[GatewayDataFetcher] Orchestrator Database is not empty, skipping initial fetch.');
            }

            setInterval(async () => {
                console.log('[GatewayDataFetcher] Orchestrator 4 hours have passed, fetching data again...');
                await this.fetchAndStoreOrchestrators();
            }, 4 * 60 * 60 * 1000); // 4 hours in milliseconds

        } catch (error) {
            console.error('[GatewayDataFetcher] Error checking or fetching orchestrators:', error);
        }
    }

    async fetchAndStoreOrchestrators() {
        try {
            const response = await fetch('https://tools.livepeer.cloud/api/orchestrator', {
                method: "GET",
                mode: "cors",
            });

            if (!response.ok) {
                throw new Error('Orchestrator response was not ok');
            }
            const orchestrators = await response.json();

            await this.db.orchestrators.clear();
            await this.db.orchestrators.bulkAdd(orchestrators);
        } catch (error) {
            console.error('Error fetching or storing orchestrators:', error);
        }
    }

    async checkAndFetchCapabilities() {

        try {
            const count = await this.db.capabilities.count();

            if (count === 0) {
                console.log('[GatewayDataFetcher] Capabilities Database is empty, fetching data...');
                await this.fetchAndStoreCapabilities();
            } else {
                console.log('[GatewayDataFetcher] Capabilities Database is not empty, skipping initial fetch.');
            }
            await this.dispatchChangeEvent();
            setInterval(async () => {
                await this.fetchAndStoreCapabilities();
                await this.dispatchChangeEvent()
            }, 4 * 60 * 60 * 1000);

        } catch (error) {
            console.error('[GatewayDataFetcher]  Error checking or fetching capabilities:', error);
        }
    }

    async fetchAndStoreCapabilities() {
        try {
            let gw = getGatewayUrl();
            let url = `${gw}/getOrchestratorAICapabilities`;
            let response = await fetch(url, {
                method: "GET",
                mode: "cors",
            });

            if (!response.ok) {
                throw new Error('[GatewayDataFetcher] fetching Orchestrator AI Capabilities response was not ok');
            }
            let data = await response.json();

            const pipelines = {};

            for (let orchestrator of data.orchestrators) {
                const ethAddress = orchestrator.address;

                // Get the orchestrator's name from the database if available
                const storedOrchestrator = await this.db.orchestrators.get(ethAddress);
                const storedOrchestratorName = storedOrchestrator?.name || ethAddress

                for (let pipeline of orchestrator.pipelines) {
                    const pipelineType = pipeline.type;

                    if (!pipelines[pipelineType]) {
                        pipelines[pipelineType] = {
                            name: pipelineType,
                            models: []
                        };
                    }

                    for (let model of pipeline.models) {
                        const modelName = model.name;
                        const modelStatus = model.status;

                        let pipelineModels = pipelines[pipelineType].models;

                        let modelEntry = pipelineModels.find(m => m.name === modelName);

                        if (!modelEntry) {
                            modelEntry = {
                                name: modelName,
                                Cold: 0,
                                Warm: 0,
                                orchestrators: []
                            };
                            pipelineModels.push(modelEntry);
                        }

                        modelEntry.Cold += modelStatus.Cold;
                        modelEntry.Warm += modelStatus.Warm;

                        modelEntry.orchestrators.push({
                            ethAddress: storedOrchestratorName,
                            warm: modelStatus.Warm
                        });
                    }
                }
            }

            // Now, clear the capabilities database and store the new data
            await this.db.capabilities.clear();

            for (let pipelineName in pipelines) {
                await this.db.capabilities.add({
                    name: pipelineName,
                    models: pipelines[pipelineName].models
                });
            }

        } catch (error) {
            console.error('[GatewayDataFetcher] Error fetching or storing capabilities:', error);
        }
    }

    // New method to trigger fetching capabilities data
    async triggerFetchCapabilities() {
        console.log('[GatewayDataFetcher] Triggering manual fetch of capabilities data...');
        await this.fetchAndStoreCapabilities();
        await this.dispatchChangeEvent();
    }

    async dispatchChangeEvent (){
        let detail = await this.db.capabilities.toArray();
        dispatchEvent(new CustomEvent(PIPELINE_CHANGED_EVENT,{composed: true, bubbles:true,cancelable:true,detail}))
    }
}
export const PIPELINE_CHANGED_EVENT="PipelinesFetched";
export const gatewayDataFetcher = new GatewayDataFetcher();
