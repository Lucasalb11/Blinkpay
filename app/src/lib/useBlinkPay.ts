'use client'

import { useMemo } from 'react'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { Program, Idl } from '@coral-xyz/anchor'
import idl from './idl.json'
import { PublicKey } from '@solana/web3.js'

// Program ID
const PROGRAM_ID = new PublicKey('GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV')

export function useBlinkPay() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  const program = useMemo(() => {
    if (!wallet) return null
    return new Program(idl as Idl, PROGRAM_ID, {
      connection,
      ...wallet,
    })
  }, [connection, wallet])

  return program
}

export function useBlinkPayProgramId() {
  return PROGRAM_ID
}