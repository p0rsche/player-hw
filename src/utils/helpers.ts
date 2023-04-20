export const debug = console.debug
export const assert = console.assert
export const log = console.log

export const getFileExtensionFromUrl = (url: string): string => {
  const fileName = url.split('/').pop()
  const fileExt = fileName?.split('.').pop()
  
  return fileExt ?? ''
}
