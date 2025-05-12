import { SecretString } from '@/types';
import { queryPool } from '@/utils/apis/getPairPool';
import { handleApiError } from '@/utils/apis/handleApiError';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function getPoolInfo(req: NextApiRequest, res: NextApiResponse) {
  const { contract_addr } = req.query as { contract_addr: SecretString };

  if (
    typeof contract_addr === undefined ||
    (Array.isArray(contract_addr) && contract_addr.length === 0) ||
    typeof contract_addr !== 'string' ||
    contract_addr.length === 0 ||
    (Array.isArray(contract_addr) &&
      contract_addr.length === 1 &&
      typeof contract_addr[0] === 'string' &&
      contract_addr[0].length === 0)
  ) {
    return res.status(400).json({ error: 'contract_addr query parameter is required' });
  }

  try {
    if (contract_addr.length === 0) {
      return res.status(400).json({ error: 'contract_addr query parameter is required' });
    }
    // if it doesnt start with secret1
    if (!contract_addr.startsWith('secret1')) {
      return res.status(400).json({ error: 'contract_addr must start with secret1' });
    }
    const data = await queryPool(contract_addr);
    res.status(200).json(data);
  } catch (error) {
    handleApiError(error, res);
  }
}
