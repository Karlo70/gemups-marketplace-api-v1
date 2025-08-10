export const errorMessageFormatter = (errMessage: string): string => {
  let formattedMessage = errMessage[0].toUpperCase();

  for (let i = 1; i < errMessage.length; i++) {
    const char = errMessage[i];

    if (char === '_') {
      formattedMessage += ` ${errMessage.slice(i + 1)}`;
      break;
    } else {
      formattedMessage += char;
    }
  }

  return formattedMessage;
};
