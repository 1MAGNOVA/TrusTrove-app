import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { getConfig, getSorobanServer } from './config.js';

export class BaseContractClient {
  protected contractId: string;

  constructor(contractId: string) {
    if (!contractId) {
      throw new Error('Contract ID is required');
    }
    this.contractId = contractId;
  }

  protected get contract(): Contract {
    return new Contract(this.contractId);
  }

  protected async readContract<T>(
    method: string,
    args: xdr.ScVal[],
    publicKey: string,
    parse: (val: xdr.ScVal) => T
  ): Promise<T> {
    const config = getConfig();
    const server = getSorobanServer();
    const account = await server.getAccount(publicKey);
    
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(sim)) {
      throw new Error(`Simulation failed for ${method}: ${sim.error}`);
    }
    
    const resultVal = (sim as SorobanRpc.Api.SimulateTransactionSuccessResponse).result?.retval;
    if (!resultVal) {
      throw new Error(`No return value from simulation for ${method}`);
    }
    
    return parse(resultVal);
  }

  protected async writeContract(
    method: string,
    args: xdr.ScVal[],
    publicKey: string
  ): Promise<string> {
    const config = getConfig();
    const server = getSorobanServer();
    const account = await server.getAccount(publicKey);
    
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(sim)) {
      throw new Error(`Simulation failed for ${method}: ${sim.error}`);
    }

    const prepared = await server.prepareTransaction(tx);
    const signed = await signTransaction(prepared.toXDR(), {
      network: config.networkPassphrase === Networks.PUBLIC ? 'PUBLIC' : 'TESTNET',
      networkPassphrase: config.networkPassphrase,
      accountToSign: publicKey,
    });

    const result = await server.sendTransaction(
      TransactionBuilder.fromXDR(signed, config.networkPassphrase)
    );

    if (result.status === 'ERROR') {
      throw new Error(`Send failed for ${method}: ${result.errorResult?.toXDR()}`);
    }

    // Poll for confirmation
    let response = await server.getTransaction(result.hash);
    while (response.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      await new Promise(r => setTimeout(r, 1000));
      response = await server.getTransaction(result.hash);
    }

    if (response.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed on-chain for ${method}`);
    }

    return result.hash;
  }
}
