
const bearerToken = import.meta.env.VITE_GATEWAY_BEARER_TOKEN;

export const getBearerToken = ()=>{
    return bearerToken ? bearerToken: "None"
}

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
