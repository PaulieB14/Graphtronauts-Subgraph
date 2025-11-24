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
  RewardSource,
  RewardAccount,
  RewardAccountToken
} from "../generated/schema"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"

const REWARDS_GATEWAY = Address.fromString("0x71a7C47d35c294CbA1eD23b67310f1d766A4b1f8")
const REWD_SPLIT_V1 = Address.fromString("0x70c444A09bfacCF826Ff319e8F12Aa97A17c5EF2")
const ONE = BigInt.fromI32(1)

function getSourceName(address: Address): string {
  if (address.equals(REWARDS_GATEWAY)) {
    return "RewardsGateway"
  }
  if (address.equals(REWD_SPLIT_V1)) {
    return "RewdSplitV1"
  }
  return "Unknown"
}

function getOrCreateRewardSource(address: Address, block: BigInt, timestamp: BigInt): RewardSource {
  let addressBytes = address as Bytes
  let source = RewardSource.load(addressBytes)
  if (source == null) {
    source = new RewardSource(addressBytes)
    source.name = getSourceName(address)
    source.totalNativeReleased = BigInt.zero()
    source.totalTokenReleased = BigInt.zero()
    source.totalDeposited = BigInt.zero()
    source.nativePayoutCount = BigInt.zero()
    source.tokenPayoutCount = BigInt.zero()
    source.payeeCount = BigInt.zero()
  }
  source.lastUpdatedBlock = block
  source.lastUpdatedTimestamp = timestamp
  return source
}

function getOrCreateRewardAccount(account: Address, block: BigInt, timestamp: BigInt): RewardAccount {
  let accountBytes = account as Bytes
  let entity = RewardAccount.load(accountBytes)
  if (entity == null) {
    entity = new RewardAccount(accountBytes)
    entity.totalNativeReleased = BigInt.zero()
    entity.totalTokenReleased = BigInt.zero()
    entity.nativePayoutCount = BigInt.zero()
    entity.tokenPayoutCount = BigInt.zero()
  }
  entity.lastUpdatedBlock = block
  entity.lastUpdatedTimestamp = timestamp
  return entity
}

function getOrCreateRewardAccountToken(
  account: Address,
  token: Address,
  block: BigInt,
  timestamp: BigInt
): RewardAccountToken {
  let id = Bytes.fromUTF8(account.toHexString() + "-" + token.toHexString())
  let entity = RewardAccountToken.load(id)
  if (entity == null) {
    entity = new RewardAccountToken(id)
    entity.account = account as Bytes
    entity.token = token as Bytes
    entity.totalReleased = BigInt.zero()
    entity.payoutCount = BigInt.zero()
  }
  entity.lastUpdatedBlock = block
  entity.lastUpdatedTimestamp = timestamp
  return entity
}

export function handleERC20PaymentReleased(event: ERC20PaymentReleasedEvent): void {
  let entity = new ERC20PaymentReleased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  // Get or create source
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  
  entity.contract = event.address
  entity.source = source.id
  entity.token = event.params.token
  entity.to = event.params.to
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Update source analytics
  source.totalTokenReleased = source.totalTokenReleased.plus(event.params.amount)
  source.tokenPayoutCount = source.tokenPayoutCount.plus(ONE)
  source.save()

  // Update account analytics
  let account = getOrCreateRewardAccount(event.params.to, event.block.number, event.block.timestamp)
  account.totalTokenReleased = account.totalTokenReleased.plus(event.params.amount)
  account.tokenPayoutCount = account.tokenPayoutCount.plus(ONE)
  account.save()

  // Update account-token analytics
  let accountToken = getOrCreateRewardAccountToken(
    event.params.to,
    event.params.token,
    event.block.number,
    event.block.timestamp
  )
  accountToken.totalReleased = accountToken.totalReleased.plus(event.params.amount)
  accountToken.payoutCount = accountToken.payoutCount.plus(ONE)
  accountToken.save()
}

export function handlePayeeAdded(event: PayeeAddedEvent): void {
  let entity = new PayeeAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  // Get or create source
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  
  entity.contract = event.address
  entity.source = source.id
  entity.account = event.params.account
  entity.shares = event.params.shares
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Update source analytics (only increment payee count for new payees)
  source.payeeCount = source.payeeCount.plus(ONE)
  source.save()
}

export function handlePaymentReceived(event: PaymentReceivedEvent): void {
  let entity = new PaymentReceived(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  // Get or create source
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  
  entity.contract = event.address
  entity.source = source.id
  entity.from = event.params.from
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Update source analytics
  source.totalDeposited = source.totalDeposited.plus(event.params.amount)
  source.save()
}

export function handlePaymentReleased(event: PaymentReleasedEvent): void {
  let entity = new PaymentReleased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  // Get or create source
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  
  entity.contract = event.address
  entity.source = source.id
  entity.to = event.params.to
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Update source analytics
  source.totalNativeReleased = source.totalNativeReleased.plus(event.params.amount)
  source.nativePayoutCount = source.nativePayoutCount.plus(ONE)
  source.save()

  // Update account analytics
  let account = getOrCreateRewardAccount(event.params.to, event.block.number, event.block.timestamp)
  account.totalNativeReleased = account.totalNativeReleased.plus(event.params.amount)
  account.nativePayoutCount = account.nativePayoutCount.plus(ONE)
  account.save()
}
