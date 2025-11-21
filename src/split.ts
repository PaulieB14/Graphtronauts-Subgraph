import {
  ERC20PaymentReleased as ERC20PaymentReleasedEvent,
  Initialized as InitializedEvent,
  PayeeAdded as PayeeAddedEvent,
  PaymentReceived as PaymentReceivedEvent,
  PaymentReleased as PaymentReleasedEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent
} from "../generated/Split/Split"
import {
  ERC20PaymentReleased,
  Initialized,
  PayeeAdded,
  PaymentReceived,
  PaymentReleased,
  RewardAccount,
  RewardAccountToken,
  RewardPayee,
  RewardSource,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked
} from "../generated/schema"
import { Address, BigInt } from "@graphprotocol/graph-ts"

const REWARDS_GATEWAY = Address.fromString("0x71a7C47d35c294CbA1eD23b67310f1d766A4b1f8")
const REWD_SPLIT_V1 = Address.fromString("0x70c444A09bfacCF826Ff319e8F12Aa97A17c5EF2")

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
  let source = RewardSource.load(address)
  if (source == null) {
    source = new RewardSource(address)
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
  let entity = RewardAccount.load(account)
  if (entity == null) {
    entity = new RewardAccount(account)
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
  let id = account.toHexString() + "-" + token.toHexString()
  let entity = RewardAccountToken.load(id)
  if (entity == null) {
    entity = new RewardAccountToken(id)
    entity.account = account
    entity.token = token
    entity.totalReleased = BigInt.zero()
    entity.payoutCount = BigInt.zero()
  }
  entity.lastUpdatedBlock = block
  entity.lastUpdatedTimestamp = timestamp
  return entity
}

const ONE = BigInt.fromI32(1)

export function handleERC20PaymentReleased(
  event: ERC20PaymentReleasedEvent
): void {
  let entity = new ERC20PaymentReleased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  entity.source = source.id
  entity.token = event.params.token
  entity.to = event.params.to
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  source.totalTokenReleased = source.totalTokenReleased.plus(event.params.amount)
  source.tokenPayoutCount = source.tokenPayoutCount.plus(ONE)
  source.save()

  let account = getOrCreateRewardAccount(event.params.to, event.block.number, event.block.timestamp)
  account.totalTokenReleased = account.totalTokenReleased.plus(event.params.amount)
  account.tokenPayoutCount = account.tokenPayoutCount.plus(ONE)
  account.save()

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

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  entity.source = source.id
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  source.save()
}

export function handlePayeeAdded(event: PayeeAddedEvent): void {
  let entity = new PayeeAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  entity.source = source.id
  entity.account = event.params.account
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let payeeId = event.address.toHexString() + "-" + event.params.account.toHexString()
  let payee = RewardPayee.load(payeeId)
  if (payee == null) {
    payee = new RewardPayee(payeeId)
    payee.source = source.id
    payee.account = event.params.account
    payee.shares = event.params.shares
    payee.addedBlock = event.block.number
    payee.addedTimestamp = event.block.timestamp
    payee.transactionHash = event.transaction.hash
    payee.save()

    source.payeeCount = source.payeeCount.plus(ONE)
  }

  source.save()
}

export function handlePaymentReceived(event: PaymentReceivedEvent): void {
  let entity = new PaymentReceived(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  entity.source = source.id
  entity.from = event.params.from
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  source.totalDeposited = source.totalDeposited.plus(event.params.amount)
  source.save()
}

export function handlePaymentReleased(event: PaymentReleasedEvent): void {
  let entity = new PaymentReleased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  entity.source = source.id
  entity.to = event.params.to
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  source.totalNativeReleased = source.totalNativeReleased.plus(event.params.amount)
  source.nativePayoutCount = source.nativePayoutCount.plus(ONE)
  source.save()

  let account = getOrCreateRewardAccount(event.params.to, event.block.number, event.block.timestamp)
  account.totalNativeReleased = account.totalNativeReleased.plus(event.params.amount)
  account.nativePayoutCount = account.nativePayoutCount.plus(ONE)
  account.save()
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  entity.source = source.id
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let entity = new RoleGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  entity.source = source.id
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let entity = new RoleRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  let source = getOrCreateRewardSource(event.address, event.block.number, event.block.timestamp)
  entity.source = source.id
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  source.save()
}
