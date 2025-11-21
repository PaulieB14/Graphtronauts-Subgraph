import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  ERC20PaymentReleased,
  Initialized,
  PayeeAdded,
  PaymentReceived,
  PaymentReleased,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked
} from "../generated/Split/Split"

export function createERC20PaymentReleasedEvent(
  token: Address,
  to: Address,
  amount: BigInt
): ERC20PaymentReleased {
  let erc20PaymentReleasedEvent =
    changetype<ERC20PaymentReleased>(newMockEvent())

  erc20PaymentReleasedEvent.parameters = new Array()

  erc20PaymentReleasedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  erc20PaymentReleasedEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  erc20PaymentReleasedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return erc20PaymentReleasedEvent
}

export function createInitializedEvent(version: i32): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(version))
    )
  )

  return initializedEvent
}

export function createPayeeAddedEvent(
  account: Address,
  shares: BigInt
): PayeeAdded {
  let payeeAddedEvent = changetype<PayeeAdded>(newMockEvent())

  payeeAddedEvent.parameters = new Array()

  payeeAddedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  payeeAddedEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return payeeAddedEvent
}

export function createPaymentReceivedEvent(
  from: Address,
  amount: BigInt
): PaymentReceived {
  let paymentReceivedEvent = changetype<PaymentReceived>(newMockEvent())

  paymentReceivedEvent.parameters = new Array()

  paymentReceivedEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  paymentReceivedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return paymentReceivedEvent
}

export function createPaymentReleasedEvent(
  to: Address,
  amount: BigInt
): PaymentReleased {
  let paymentReleasedEvent = changetype<PaymentReleased>(newMockEvent())

  paymentReleasedEvent.parameters = new Array()

  paymentReleasedEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  paymentReleasedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return paymentReleasedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}
