import { Address, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { BaseContractClient } from '../base.js';
import { Profile } from '../types/index.js';

export class RegistryClient extends BaseContractClient {
  async registerIssuer(
    address: string,
    metadata: Record<string, string>,
    signerPublicKey: string
  ): Promise<string> {
    const args = [
      new Address(address).toScVal(),
      nativeToScVal(metadata),
    ];
    return this.writeContract('register_issuer', args, signerPublicKey);
  }

  async registerBuyer(
    address: string,
    metadata: Record<string, string>,
    signerPublicKey: string
  ): Promise<string> {
    const args = [
      new Address(address).toScVal(),
      nativeToScVal(metadata),
    ];
    return this.writeContract('register_buyer', args, signerPublicKey);
  }

  async isVerified(address: string, signerPublicKey: string): Promise<boolean> {
    const args = [new Address(address).toScVal()];
    return this.readContract(
      'is_verified',
      args,
      signerPublicKey,
      (val) => !!scValToNative(val)
    );
  }

  async getProfile(address: string, signerPublicKey: string): Promise<Profile> {
    const args = [new Address(address).toScVal()];
    return this.readContract(
      'get_profile',
      args,
      signerPublicKey,
      (val) => {
        const native = scValToNative(val);
        let addressStr = '';
        let role: 'issuer' | 'buyer' = 'issuer';
        let verified = false;
        let registeredAt = 0;

        if (native instanceof Map) {
          addressStr = native.get('address')?.toString() || '';
          role = native.get('role')?.toString() === 'buyer' ? 'buyer' : 'issuer';
          verified = !!native.get('verified');
          const regAt = native.get('registered_at');
          registeredAt = typeof regAt === 'bigint' ? Number(regAt) : Number(regAt || 0);
        } else if (typeof native === 'object' && native !== null) {
          const obj = native as Record<string, unknown>;
          addressStr = obj.address?.toString() || '';
          role = obj.role?.toString() === 'buyer' ? 'buyer' : 'issuer';
          verified = !!obj.verified;
          const regAt = obj.registered_at;
          registeredAt = typeof regAt === 'bigint' ? Number(regAt) : Number(regAt || 0);
        }

        return {
          address: addressStr,
          role,
          verified,
          registeredAt,
        };
      }
    );
  }

  async revoke(address: string, signerPublicKey: string): Promise<string> {
    const args = [new Address(address).toScVal()];
    return this.writeContract('revoke', args, signerPublicKey);
  }
}
