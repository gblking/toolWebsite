import CryptoJS from 'crypto-js'

export function toSha256(value: string) {
  return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex)
}

export function toMd5(value: string) {
  return CryptoJS.MD5(value).toString(CryptoJS.enc.Hex)
}
