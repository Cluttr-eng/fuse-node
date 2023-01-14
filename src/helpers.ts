export const getHeaderValue = (headers: any, key: string): string => {
  for (let header of Object.keys(headers)) {
    if (header.toLowerCase() === key) {
      return headers[header]!;
    }
  }
  return null;
};
