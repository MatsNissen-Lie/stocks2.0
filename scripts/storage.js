const fs = require("fs");

const saveData = (data, intervall, keys = []) => {
  if (!keys.length) keys = Object.keys(data);

  keys.forEach((key) => {
    const filePath = `./filer_new/${intervall + key}.jsonl`;
    let existingData = [];

    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      existingData = fileContent
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      console.log("existingData", existingData[existingData.length - 1]);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.log("Failed to save", intervall, key);
        console.error(err);
        return;
      }
    }
    console.log("key", key);
    console.log("intervall", intervall);
    const newData = data[key][intervall];

    // Find the index where the new data starts
    let startIndex = 0;
    if (existingData.length !== 0) {
      for (let i = 0; i < newData.length; i++) {
        if (
          newData[i].datetime ===
          existingData[existingData.length - 1]?.datetime
        ) {
          startIndex = i + 1; // Start after the last matched entry
          break;
        }
      }
    }

    let updatedLastEntry = false;

    // Update the last existing entry if necessary
    if (existingData.length > 0 && startIndex > 0) {
      const lastExistingEntry = existingData[existingData.length - 1];
      const correspondingNewEntry = newData[startIndex - 1];
      if (lastExistingEntry.datetime === correspondingNewEntry.datetime) {
        if (
          JSON.stringify(lastExistingEntry) !==
            JSON.stringify(correspondingNewEntry) ||
          true
        ) {
          console.log("updating last entry with", correspondingNewEntry);
          existingData[existingData.length - 1] = correspondingNewEntry;
          updatedLastEntry = true;
        }
      }
    }
    // Append new data entries
    const newEntries = newData.slice(startIndex);
    const appendedData = newEntries
      .map((entry) => JSON.stringify(entry))
      .join("\n");
    const nothingToAppend = appendedData === "" || appendedData.length === 0;

    if (updatedLastEntry) {
      console.log("Updating last entry in", filePath);
      const lastEntryStr =
        JSON.stringify(existingData[existingData.length - 1]) + nothingToAppend
          ? "\n"
          : "";
      console.log("lastEntryStr", lastEntryStr);

      fs.readFileSync(filePath, "utf8", (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        const lastNewlineIndex = data.lastIndexOf("\n", data.length - 2); // Find the position of the second last newline
        console.log("lastNewlineIndex", lastNewlineIndex);
        const position = lastNewlineIndex + 1;
        const fileDescriptor = fs.openSync(filePath, "r+");

        // Create a buffer from the last entry string
        const buffer = Buffer.from(lastEntryStr, "utf8");
        // console.log("buffer", buffer);
        // Write the buffer to the file at the specified position
        fs.writeSync(fileDescriptor, buffer, 0, buffer.length, position);
        fs.closeSync(fileDescriptor);
      });
    }

    // Append new entries to the file
    if (nothingToAppend) {
      console.log("No new data to append after last entry in", filePath);
      return;
    }
    fs.appendFileSync(filePath, appendedData + "\n", (err) => {
      console.error(
        err
          ? err
          : intervall + " " + key + " data successfully appended to file!\n"
      );
    });
  });
};

const retrieveData = (symboler = [], intervaller) => {
  if (symboler.length === 0) symboler = get_stored_keys();
  console.log("Henter data fra filer for", symboler);
  let data = {};
  symboler.forEach((symbol) => {
    data[symbol] = {};
    intervaller.forEach((intervall) => {
      try {
        const response = fs.readFileSync(
          `filer_new/${intervall + symbol}.jsonl`,
          "utf-8"
        );
        const lines = response.trim().split("\n");
        const json_data = lines.map((line) => JSON.parse(line));
        data[symbol][intervall] = json_data;
      } catch (err) {
        console.log("Error reading", intervall + symbol + ".jsonl");
        console.error(err);
      }
    });
  });
  return data;
};

const get_stored_keys = () => {
  let files = fs.readdirSync("./filer_new/");
  let tickers = [];
  files.forEach((file) => {
    if (file !== ".DS_Store") {
      // Ignore .DS_Store if it exists
      let ticker = file.match(/[A-Z]+/)[0]; // Extract ticker symbol
      if (!tickers.includes(ticker)) {
        // Avoid duplicates
        tickers.push(ticker);
      }
    }
  });
  return tickers;
};
const get_stored_keys_old = () => {
  let files = fs.readdirSync("./filer/");
  let tickers = [];
  files.forEach((file) => {
    if (file !== ".DS_Store") {
      // Ignore .DS_Store if it exists
      let ticker = file.match(/[A-Z]+/)[0]; // Extract ticker symbol
      if (!tickers.includes(ticker)) {
        // Avoid duplicates
        tickers.push(ticker);
      }
    }
  });
  return tickers;
};

const retrieveDataOld = (symboler = [], intervaller) => {
  if (symboler.length === 0) symboler = get_stored_keys_old();
  let data = {};
  symboler.forEach((symbol) => {
    data[symbol] = {};
    intervaller.forEach((intervall) => {
      try {
        const response = fs.readFileSync(
          `filer/${intervall + symbol}.json`,
          "utf-8"
        );
        const json_data = JSON.parse(response);
        data[symbol][intervall] = json_data;
      } catch {}
    });
  });
  return data;
};

const get_old_data_and_store_it = () => {
  // const intervaller = ["1min", "1day", "1week"];
  const intervaller = ["1week"];
  let data = retrieveDataOld(["AAPL"], intervaller);

  const copy_last_object = (data) => {
    let new_data = {};
    for (let symbol in data) {
      new_data[symbol] = {};
      for (let intervall in data[symbol]) {
        const lastObject = data[symbol][intervall].slice(-1)[0];
        new_data[symbol][intervall] = [JSON.parse(JSON.stringify(lastObject))];
        // change the close value to -1 to indicate that it is not up to date
        // data[symbol][intervall].slice(-1)[0].close = -1;
      }
    }
    return new_data;
  };
  const last_objects = copy_last_object(data);

  // console.log the data of the last appl object
  // console.log(data["AAPL"]["1week"].slice(-1)[0]);

  for (let i = 0; i < intervaller.length; i++) {
    saveData(data, intervaller[i]);
  }

  for (let i = 0; i < intervaller.length; i++) {
    saveData(last_objects, intervaller[i]);
  }
};

// get_old_data_and_store_it();

// storage.js
module.exports = {
  saveData,
  retrieveData,
  get_stored_keys,
};
