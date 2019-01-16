const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const sleep = (miliseconds) => {
  const currentTime = new Date().getTime();

  while (currentTime + miliseconds >= new Date().getTime()) {}
}

// Networking
const putHTML = (message) => {
  const http = new XMLHttpRequest();
  const url = 'http://192.168.4.100';
  process.stdout.write(`SignCommunicator message: ${message}`);
  const params = `<sign>{${message}}<endsign>`;
  
  http.open('POST', url, false); // making synchronous
  http.timeout = 500;
  // Send the proper header information along with the request
  http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  http.send(params);
  process.stdout.write(`SignCommunicator http.status: ${http.status}`);
  return http.status;
}

process.on('message', (message) => {
  if (Object.prototype.hasOwnProperty.call(message, 'command')) {
    // checking which command we want to run
    switch (message.command) {
    case 'putHTML':
      process.stdout.write(`signcommunicator ${JSON.stringify(message.messages)}`)

      let messages = message.messages
      // Checking if messages is an array
      if (!Array.isArray(messages)) {
        // Converting to an array if not
        messages = [messages];
      }

      messages.forEach(message => {
        process.send({
          status: 'processing',
          returnValue: 'aaaaa',
        })
        putHTML(message);
        sleep(1000);
      });

      process.send({
          status: 'done',
          returnValue: 'finished',
      })
      break
    default:
      // unknown command
      process.send({
          status: 'done',
          returnValue: `unknown command: ${message.command}`,
      })
      break
    }
  } else {
    process.stdout.write(`Unexpected message to SignCommunicator: ${JSON.stringify(message)}`)
  }
})
