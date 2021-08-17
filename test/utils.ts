export async function getBalance(address: string): Promise<BN> {
    return web3.utils.toBN(await web3.eth.getBalance(address));
}

export function calculateGas(gasPrice: string, gasUsed: string): BN {
    return web3.utils.toBN(gasPrice).mul(web3.utils.toBN(gasUsed));
}
