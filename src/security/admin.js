import config from "../config/config.js";

const OWNER_NUMBER = "263780858655";
const OWNER_LIDS = [
  "203813931753538"
];

function normalizeNumber(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/[^0-9]/g, "");
}

function getAdminLids() {
  const value =
    process.env.ADMIN_LIDS || "";

  return value
    .split(",")
    .map((item) => normalizeNumber(item))
    .filter(Boolean);
}

function isOwner(sender) {
  if (!sender) {
    return false;
  }

  const rawSender =
    String(sender);

  const identifier =
    normalizeNumber(
      rawSender.split("@")[0]
    );

  /*
   * Owner phone number.
   */
  if (identifier === OWNER_NUMBER) {
    return true;
  }

  /*
   * Owner WhatsApp LID.
   *
   * WhatsApp may identify the owner using a LID
   * instead of the phone number.
   */
  if (rawSender.includes("@lid")) {
    return OWNER_LIDS.includes(identifier);
  }

  return false;
}

function isAdmin(sender) {
  if (!sender) {
    return false;
  }

  const rawSender =
    String(sender);

  /*
   * WhatsApp LID sender.
   */
  if (rawSender.includes("@lid")) {
    const lid =
      normalizeNumber(
        rawSender.split("@")[0]
      );

    return getAdminLids().includes(lid);
  }

  /*
   * Normal WhatsApp phone JID.
   */
  const senderNumber =
    normalizeNumber(
      rawSender.split("@")[0]
    );

  if (!senderNumber) {
    return false;
  }

  return config.admins.numbers.some(
    (adminNumber) =>
      normalizeNumber(adminNumber) ===
      senderNumber
  );
}

export default {
  isAdmin,
  isOwner,
  OWNER_NUMBER
};
