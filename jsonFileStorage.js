/* eslint-disable import/prefer-default-export */
import { readFile, writeFile } from 'fs';

export function write(filename, jsonContentObj, callback) {
  const jsonContentStr = JSON.stringify(jsonContentObj);

  writeFile(filename, jsonContentStr, (writeErr) => {
    if (writeErr) {
      console.error('Write error', jsonContentStr, writeErr);
      callback(writeErr, null);
      return;
    }
    console.log('Write success!');
    callback(null, jsonContentStr);
  });
}

export function read(filename, callback) {
  const handleFileRead = (readErr, jsonContentStr) => {
    if (readErr) {
      console.error('Read error', readErr);
      callback(readErr, null);
      return;
    }
    const jsonContentObj = JSON.parse(jsonContentStr);

    callback(null, jsonContentObj);
  };

  readFile(filename, 'utf-8', handleFileRead);
}

export function edit(filename, readCallback, writeCallback) {
  read(filename, (readErr, jsonContentObj) => {
    if (readErr) {
      console.error('Read error', readErr);
      readCallback(readErr, null);
      return;
    }

    readCallback(null, jsonContentObj);

    write(filename, jsonContentObj, writeCallback);
  });
}

export function add(filename, key, input, callback) {
  edit(filename, (err, jsonContentObj) => {
    if (err) {
      console.log('Edit error', err);
      callback(err);
      return;
    }

    if (!(key in jsonContentObj)) {
      console.error('Key does not exist');
      callback('Key does not exist');
      return;
    }

    jsonContentObj[key].push(input);
  }, callback);
}
