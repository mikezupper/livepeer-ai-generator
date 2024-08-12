// import Dexie from "dexie";


// /*
// |----------------------------|
// | Declare your database      |
// |----------------------------|
// */
// console.log("Creating Dexie DB ");

// const db = new Dexie('LivepeerAI');

// // Declare tables, IDs and indexes
// db.version(1).stores({
//     pipelines: '++id, pipeline_name, model, cold, warm'
// });

// console.log("Using Dexie v" + Dexie.semVer);

// export const getDatabase = () => {
//     return db;
// }


export const getGatewayUrl = () => {
    const value = localStorage.getItem("gatewayUrl")
    // console.log("[getGatewayUrl] returning url = ", value)
    return value;
}

export const setGatewayUrl = (gatewayUrl) => {
    console.log("[setGatewayUrl] setting url = ", gatewayUrl)
    localStorage.setItem("gatewayUrl", gatewayUrl)
    // console.log("[setGatewayUrl] completed.")
}

export const getDefaultNavLink = () => {
    const value = localStorage.getItem("defaultNavLink")
    // console.log("[getDefaultNavLink] returning = ", value)
    return value;
}
export const setDefaultNavLink = (navLink) => {
    console.log("[setDefaultNavLink] set ", navLink)
    localStorage.setItem("defaultNavLink", navLink)
    console.log("[setDefaultNavLink] completed.")
}

export const num_between = (x, min, max) => {
    return x >= min && x <= max;
};
