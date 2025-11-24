import {
  ERC20PaymentReleased as ERC20PaymentReleasedEvent,
  PayeeAdded as PayeeAddedEvent,
  PaymentReceived as PaymentReceivedEvent,
  PaymentReleased as PaymentReleasedEvent
} from "../generated/Split/Split"
import {
  ERC20PaymentReleased,
  PayeeAdded,
  PaymentReceived,
  PaymentReleased,
  RewardSplitter
} from "../generated/schema"
import { Address, BigInt } from "@graphprotocol/graph-ts"

const REWARDS_GATEWAY = Address.fromString("0x71a7C47d35c294CbA1eD23b67310f1d766A4b1f8")
const REWD_SPLIT_V1 = Address.fromString("0x70c444A09bfacCF826Ff319e8F12Aa97A17c5EF2")

function getSplitterName(address: Address): string {
  if (address.equals(REWARDS_GATEWAY)) {
    return "Rewards Gateway"
  }
  if (address.equals(REWD_SPLIT_V1)) {
    return "RewdSplit V1"
  }
  return "Unknown Splitter"
}

function updateSplitter(address: Address, block: BigInt, timestamp: BigInt): RewardSplitter {
  let addressBytes = address as Bytes
  let splitter = RewardSplitter.load(addressBytes)
  if (splitter == null) {
    splitter = new RewardSplitter(addressBytes)
    splitter.name = getSplitterName(address)
    splitter.totalNativeReceived = BigInt.zero()
    splitter.totalNativeReleased = BigInt.zero()
    splitter.totalTokenReleased = BigInt.zero()
    splitter.payeeCount = BigInt.zero()
  }
  splitter.lastUpdatedBlock = block
  splitter.lastUpdatedTimestamp = timestamp
  return splitter
}

export function handleERC20PaymentReleased(event: ERC20PaymentReleasedEvent): void {
  let entity = new ERC20PaymentReleased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.contract = event.address
  entity.token = event.params.token
  entity.to = event.params.to
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Update splitter totals
  let splitter = updateSplitter(event.address, event.block.number, event.block.timestamp)
  splitter.totalTokenReleased = splitter.totalTokenReleased.plus(event.params.amount)
  splitter.save()
}

export function handlePayeeAdded(event: PayeeAddedEvent): void {
  let entity = new PayeeAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.contract = event.address
  entity.account = event.params.account
  entity.shares = event.params.shares
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Update splitter payee count
  let splitter = updateSplitter(event.address, event.block.number, event.block.timestamp)
  splitter.payeeCount = splitter.payeeCount.plus(BigInt.fromI32(1))
  splitter.save()
}

export function handlePaymentReceived(event: PaymentReceivedEvent): void {
  let entity = new PaymentReceived(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.contract = event.address
  entity.from = event.params.from
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Update splitter received totals
  let splitter = updateSplitter(event.address, event.block.number, event.block.timestamp)
  splitter.totalNativeReceived = splitter.totalNativeReceived.plus(event.params.amount)
  splitter.save()
}

export function handlePaymentReleased(event: PaymentReleasedEvent): void {
  let entity = new PaymentReleased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.contract = event.address
  entity.to = event.params.to
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Update splitter released totals
  let splitter = updateSplitter(event.address, event.block.number, event.block.timestamp)
  splitter.totalNativeReleased = splitter.totalNativeReleased.plus(event.params.amount)
  splitter.save()
}
